#!/usr/bin/env python3
"""
Will's Pub Event Scraper

Scrapes event data from Will's Pub venues:
- Will's Pub
- Lil Indies
- Dirty Laundry

Extracts: event name, date/time, venue, artists, pricing, URLs, tags, and descriptions.
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
from datetime import datetime
from typing import List, Dict, Optional
import logging
import time
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WillsPubScraper:
    """Scraper for Will's Pub event venues."""

    VENUES = {
        'wills-pub': {
            'name': "Will's Pub",
            'url': 'https://willspub.org/tm-venue/wills-pub/'
        },
        'lil-indies': {
            'name': 'Lil Indies',
            'url': 'https://willspub.org/tm-venue/lil-indies/'
        },
        'dirty-laundry': {
            'name': 'Dirty Laundry',
            'url': 'https://willspub.org/tm-venue/dirty-laundry/'
        }
    }

    def __init__(self, delay: float = 1.0):
        """
        Initialize the scraper.

        Args:
            delay: Delay between requests in seconds (to be polite)
        """
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        })
        self.events = []

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """
        Fetch and parse a webpage.

        Args:
            url: URL to fetch

        Returns:
            BeautifulSoup object or None if failed
        """
        try:
            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def extract_event_data(self, event_element, venue_name: str) -> Optional[Dict]:
        """
        Extract event data from an event element.

        Args:
            event_element: BeautifulSoup element containing event info
            venue_name: Name of the venue

        Returns:
            Dictionary with event data or None
        """
        try:
            event_data = {'venue': venue_name}

            # Extract event title/name
            title_elem = event_element.find(['h2', 'h3', 'h4'], class_=re.compile(r'(event.*title|title|entry-title)', re.I))
            if not title_elem:
                title_elem = event_element.find('a', class_=re.compile(r'event', re.I))

            if title_elem:
                event_data['event_name'] = title_elem.get_text(strip=True)

                # Try to get event URL from title link
                link = title_elem.find('a') if title_elem.name != 'a' else title_elem
                if link and link.get('href'):
                    event_data['event_url'] = link['href']
            else:
                # Fallback: get any heading or strong text
                fallback = event_element.find(['h1', 'h2', 'h3', 'h4', 'strong'])
                if fallback:
                    event_data['event_name'] = fallback.get_text(strip=True)

            # Extract event URL if not found yet
            if 'event_url' not in event_data:
                link = event_element.find('a', href=True)
                if link:
                    event_data['event_url'] = link['href']

            # Extract date and time
            date_elem = event_element.find(['time', 'span', 'div'], class_=re.compile(r'(date|time|when)', re.I))
            if date_elem:
                # Check for datetime attribute
                if date_elem.name == 'time' and date_elem.get('datetime'):
                    event_data['datetime'] = date_elem['datetime']
                    event_data['date'] = date_elem['datetime'].split('T')[0]
                    if 'T' in date_elem['datetime']:
                        event_data['time'] = date_elem['datetime'].split('T')[1]

                # Get human-readable date/time
                date_text = date_elem.get_text(strip=True)
                if date_text:
                    event_data['date_display'] = date_text

            # Alternative date extraction
            if 'date' not in event_data:
                for elem in event_element.find_all(['span', 'div', 'p']):
                    text = elem.get_text(strip=True)
                    # Look for date patterns
                    if re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)', text, re.I):
                        event_data['date_display'] = text
                        break

            # Extract artist/performer names
            artist_elem = event_element.find(['div', 'span', 'p'], class_=re.compile(r'(artist|performer|headline)', re.I))
            if artist_elem:
                event_data['artists'] = artist_elem.get_text(strip=True)
            else:
                # Try to find artists in subtitle or secondary heading
                subtitle = event_element.find(['h5', 'h6', 'p'], class_=re.compile(r'subtitle', re.I))
                if subtitle:
                    event_data['artists'] = subtitle.get_text(strip=True)

            # Extract price/pricing information
            price_elem = event_element.find(['span', 'div', 'p'], class_=re.compile(r'(price|cost|ticket|admission)', re.I))
            if price_elem:
                event_data['price'] = price_elem.get_text(strip=True)
            else:
                # Search for dollar signs in text
                for elem in event_element.find_all(['span', 'div', 'p']):
                    text = elem.get_text(strip=True)
                    if '$' in text or 'free' in text.lower():
                        event_data['price'] = text
                        break

            # Extract tags/genres
            tags = []
            tag_container = event_element.find(['div', 'span'], class_=re.compile(r'(tag|genre|category|tax)', re.I))
            if tag_container:
                tag_elements = tag_container.find_all(['a', 'span'])
                tags = [tag.get_text(strip=True) for tag in tag_elements]

            # Alternative: look for individual tag elements
            if not tags:
                tag_elements = event_element.find_all(['a', 'span'], class_=re.compile(r'(tag|genre|category)', re.I))
                tags = [tag.get_text(strip=True) for tag in tag_elements if tag.get_text(strip=True)]

            if tags:
                event_data['tags'] = tags

            # Extract description
            desc_elem = event_element.find(['div', 'p'], class_=re.compile(r'(description|excerpt|content|summary)', re.I))
            if desc_elem:
                event_data['description'] = desc_elem.get_text(strip=True)
            else:
                # Try to get any paragraph that's not already extracted
                paragraphs = event_element.find_all('p')
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if len(text) > 50:  # Reasonable description length
                        event_data['description'] = text
                        break

            # Only return if we have at least an event name
            if 'event_name' in event_data:
                return event_data
            else:
                logger.warning("Event element found but no title extracted")
                return None

        except Exception as e:
            logger.error(f"Error extracting event data: {e}")
            return None

    def scrape_venue(self, venue_key: str) -> List[Dict]:
        """
        Scrape events from a specific venue.

        Args:
            venue_key: Key for the venue (e.g., 'wills-pub')

        Returns:
            List of event dictionaries
        """
        venue_info = self.VENUES[venue_key]
        venue_name = venue_info['name']
        venue_url = venue_info['url']

        logger.info(f"Scraping {venue_name}...")

        soup = self.fetch_page(venue_url)
        if not soup:
            return []

        events = []

        # Try different common event container selectors
        event_selectors = [
            {'class': re.compile(r'event', re.I)},
            {'class': re.compile(r'tm-event', re.I)},
            {'class': re.compile(r'tribe-event', re.I)},
            {'class': re.compile(r'post', re.I)},
            {'class': re.compile(r'entry', re.I)},
            {'itemtype': re.compile(r'Event', re.I)},
        ]

        event_elements = []
        for selector in event_selectors:
            elements = soup.find_all(['article', 'div', 'li'], **selector)
            if elements:
                logger.info(f"Found {len(elements)} potential event elements with selector: {selector}")
                event_elements = elements
                break

        if not event_elements:
            logger.warning(f"No event elements found for {venue_name}")
            # Try to extract any structured data
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and data.get('@type') == 'Event':
                        event_data = self.parse_json_ld_event(data, venue_name)
                        if event_data:
                            events.append(event_data)
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get('@type') == 'Event':
                                event_data = self.parse_json_ld_event(item, venue_name)
                                if event_data:
                                    events.append(event_data)
                except json.JSONDecodeError:
                    pass

            return events

        # Extract data from each event element
        for event_elem in event_elements:
            event_data = self.extract_event_data(event_elem, venue_name)
            if event_data:
                events.append(event_data)

        logger.info(f"Extracted {len(events)} events from {venue_name}")
        return events

    def parse_json_ld_event(self, data: Dict, venue_name: str) -> Optional[Dict]:
        """
        Parse event data from JSON-LD structured data.

        Args:
            data: JSON-LD event object
            venue_name: Name of the venue

        Returns:
            Dictionary with event data or None
        """
        try:
            event_data = {
                'venue': venue_name,
                'event_name': data.get('name', ''),
                'description': data.get('description', ''),
            }

            if 'startDate' in data:
                event_data['datetime'] = data['startDate']
                event_data['date'] = data['startDate'].split('T')[0]
                if 'T' in data['startDate']:
                    event_data['time'] = data['startDate'].split('T')[1]

            if 'url' in data:
                event_data['event_url'] = data['url']

            if 'offers' in data:
                offers = data['offers']
                if isinstance(offers, dict):
                    if 'price' in offers:
                        event_data['price'] = f"${offers['price']}"
                    elif 'lowPrice' in offers:
                        event_data['price'] = f"${offers['lowPrice']}"
                elif isinstance(offers, list) and offers:
                    if 'price' in offers[0]:
                        event_data['price'] = f"${offers[0]['price']}"

            if 'performer' in data:
                performers = data['performer']
                if isinstance(performers, list):
                    event_data['artists'] = ', '.join([p.get('name', '') for p in performers if isinstance(p, dict)])
                elif isinstance(performers, dict):
                    event_data['artists'] = performers.get('name', '')

            return event_data if event_data['event_name'] else None
        except Exception as e:
            logger.error(f"Error parsing JSON-LD event: {e}")
            return None

    def scrape_all_venues(self) -> List[Dict]:
        """
        Scrape events from all venues.

        Returns:
            List of all event dictionaries
        """
        all_events = []

        for venue_key in self.VENUES.keys():
            venue_events = self.scrape_venue(venue_key)
            all_events.extend(venue_events)

            # Be polite - delay between requests
            if venue_key != list(self.VENUES.keys())[-1]:
                time.sleep(self.delay)

        self.events = all_events
        return all_events

    def save_to_json(self, filename: str = 'wills_pub_events.json'):
        """
        Save events to a JSON file.

        Args:
            filename: Output filename
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.events, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(self.events)} events to {filename}")
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")

    def save_to_csv(self, filename: str = 'wills_pub_events.csv'):
        """
        Save events to a CSV file.

        Args:
            filename: Output filename
        """
        if not self.events:
            logger.warning("No events to save")
            return

        try:
            # Get all unique keys from all events
            all_keys = set()
            for event in self.events:
                all_keys.update(event.keys())

            # Convert tags to string for CSV
            csv_events = []
            for event in self.events:
                csv_event = event.copy()
                if 'tags' in csv_event and isinstance(csv_event['tags'], list):
                    csv_event['tags'] = ', '.join(csv_event['tags'])
                csv_events.append(csv_event)

            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=sorted(all_keys))
                writer.writeheader()
                writer.writerows(csv_events)

            logger.info(f"Saved {len(self.events)} events to {filename}")
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")

    def print_summary(self):
        """Print a summary of scraped events."""
        if not self.events:
            print("\nNo events found.")
            return

        print(f"\n{'='*60}")
        print(f"SCRAPED {len(self.events)} EVENTS FROM WILL'S PUB VENUES")
        print(f"{'='*60}\n")

        for i, event in enumerate(self.events, 1):
            print(f"{i}. {event.get('event_name', 'No Title')}")
            print(f"   Venue: {event.get('venue', 'Unknown')}")
            if 'date_display' in event:
                print(f"   Date: {event['date_display']}")
            elif 'date' in event:
                print(f"   Date: {event['date']}")
            if 'time' in event:
                print(f"   Time: {event['time']}")
            if 'artists' in event:
                print(f"   Artists: {event['artists']}")
            if 'price' in event:
                print(f"   Price: {event['price']}")
            if 'event_url' in event:
                print(f"   URL: {event['event_url']}")
            print()


def main():
    """Main function to run the scraper."""
    print("Will's Pub Event Scraper")
    print("========================\n")

    # Create scraper instance
    scraper = WillsPubScraper(delay=1.0)

    # Scrape all venues
    events = scraper.scrape_all_venues()

    # Print summary
    scraper.print_summary()

    # Save to files
    if events:
        scraper.save_to_json('wills_pub_events.json')
        scraper.save_to_csv('wills_pub_events.csv')
        print(f"\nData saved to wills_pub_events.json and wills_pub_events.csv")
    else:
        print("\nNo events were scraped. The website structure may have changed.")
        print("Please check the logs above for more details.")

    return events


if __name__ == '__main__':
    main()
