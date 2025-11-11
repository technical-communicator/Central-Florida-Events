#!/usr/bin/env python3
"""
Central Florida Multi-Source Event Scraper

Scrapes event data from multiple Central Florida venues and sources.
Designed to be scraper-friendly and respectful of website resources.

Supported Sources:
- Will's Pub Venues (Will's Pub, Lil Indies, Dirty Laundry)
- The Plaza Live
- The Beacham & The Social
- Additional venues can be easily added
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging
import time
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class Event:
    """Standardized event data structure."""
    name: str
    venue: str
    category: str
    description: str
    location: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    datetime_display: str
    price: str
    price_numeric: float
    price_category: str  # free, budget, moderate, premium
    external_link: str
    source: str
    source_url: str
    scraped_at: str
    tags: List[str]
    artists: str = ""
    capacity: str = "medium"
    venue_type: str = "indoor"

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)


class EventScraper(ABC):
    """Abstract base class for event scrapers."""

    def __init__(self, delay: float = 1.0):
        """
        Initialize the scraper.

        Args:
            delay: Delay between requests in seconds
        """
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CentralFloridaEventsBot/1.0 (+https://github.com/technical-communicator/Central-Florida-Events)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        })
        self.events: List[Event] = []

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
            time.sleep(self.delay)  # Be polite
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    @abstractmethod
    def scrape(self) -> List[Event]:
        """Scrape events from the source."""
        pass

    def categorize_price(self, price: float) -> str:
        """Categorize price into free/budget/moderate/premium."""
        if price == 0:
            return "free"
        elif price <= 15:
            return "budget"
        elif price <= 40:
            return "moderate"
        else:
            return "premium"

    def extract_price(self, price_text: str) -> tuple[str, float]:
        """
        Extract price from text.

        Returns:
            Tuple of (display_text, numeric_value)
        """
        if not price_text or 'free' in price_text.lower():
            return ("Free", 0.0)

        # Extract numeric price
        price_match = re.search(r'\$?\s*(\d+(?:\.\d{2})?)', price_text)
        if price_match:
            numeric = float(price_match.group(1))
            return (f"${numeric:.0f}", numeric)

        return (price_text, 0.0)

    def parse_date_time(self, date_str: str, time_str: str = "") -> Dict[str, str]:
        """
        Parse date and time strings into standardized format.

        Returns:
            Dict with 'date' (YYYY-MM-DD), 'time' (HH:MM), 'datetime_display'
        """
        result = {
            'date': '',
            'time': '',
            'datetime_display': ''
        }

        try:
            # Try various date formats
            date_formats = [
                '%Y-%m-%d',
                '%m/%d/%Y',
                '%B %d, %Y',
                '%b %d, %Y',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M'
            ]

            date_obj = None
            for fmt in date_formats:
                try:
                    date_obj = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue

            if date_obj:
                result['date'] = date_obj.strftime('%Y-%m-%d')
                result['datetime_display'] = date_obj.strftime('%A, %B %d, %Y')

                # Parse time if provided
                if time_str:
                    time_match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', time_str, re.IGNORECASE)
                    if time_match:
                        hour = int(time_match.group(1))
                        minute = int(time_match.group(2))
                        am_pm = time_match.group(3)

                        if am_pm and am_pm.upper() == 'PM' and hour != 12:
                            hour += 12
                        elif am_pm and am_pm.upper() == 'AM' and hour == 12:
                            hour = 0

                        result['time'] = f"{hour:02d}:{minute:02d}"
                        result['datetime_display'] += f" at {time_str}"

        except Exception as e:
            logger.warning(f"Error parsing date/time: {e}")

        return result


class WillsPubScraper(EventScraper):
    """Scraper for Will's Pub venues."""

    VENUES = {
        'wills-pub': {
            'name': "Will's Pub",
            'url': 'https://willspub.org/tm-venue/wills-pub/',
            'location': "1042 N Mills Ave, Orlando, FL 32803"
        },
        'lil-indies': {
            'name': 'Lil Indies',
            'url': 'https://willspub.org/tm-venue/lil-indies/',
            'location': "1036 N Mills Ave, Orlando, FL 32803"
        },
        'dirty-laundry': {
            'name': 'Dirty Laundry',
            'url': 'https://willspub.org/tm-venue/dirty-laundry/',
            'location': "1028 N Mills Ave, Orlando, FL 32803"
        }
    }

    def scrape(self) -> List[Event]:
        """Scrape events from all Will's Pub venues."""
        self.events = []

        for venue_slug, venue_info in self.VENUES.items():
            logger.info(f"Scraping {venue_info['name']}...")
            soup = self.fetch_page(venue_info['url'])

            if not soup:
                continue

            # Try JSON-LD structured data first
            events = self._extract_from_json_ld(soup, venue_info)

            # Fallback to HTML parsing
            if not events:
                events = self._extract_from_html(soup, venue_info)

            self.events.extend(events)
            logger.info(f"Found {len(events)} events at {venue_info['name']}")

        return self.events

    def _extract_from_json_ld(self, soup: BeautifulSoup, venue_info: Dict) -> List[Event]:
        """Extract events from JSON-LD structured data."""
        events = []
        scripts = soup.find_all('script', type='application/ld+json')

        for script in scripts:
            try:
                data = json.loads(script.string)

                # Handle both single event and list of events
                event_list = data if isinstance(data, list) else [data]

                for item in event_list:
                    if item.get('@type') == 'Event':
                        event = self._parse_json_ld_event(item, venue_info)
                        if event:
                            events.append(event)

            except (json.JSONDecodeError, AttributeError) as e:
                logger.debug(f"Error parsing JSON-LD: {e}")
                continue

        return events

    def _parse_json_ld_event(self, data: Dict, venue_info: Dict) -> Optional[Event]:
        """Parse a single JSON-LD event object."""
        try:
            name = data.get('name', '').strip()
            if not name:
                return None

            # Parse date/time
            start_date = data.get('startDate', '')
            date_time_info = self.parse_date_time(start_date)

            # Extract price
            offers = data.get('offers', {})
            price_text = offers.get('price', 'Free') if isinstance(offers, dict) else 'Free'
            price_display, price_numeric = self.extract_price(str(price_text))

            # Get description
            description = data.get('description', '')
            if isinstance(description, str):
                description = description[:500]  # Limit length

            # Get performer/artists
            performer = data.get('performer', {})
            artists = performer.get('name', '') if isinstance(performer, dict) else ''

            # Get URL
            url = data.get('url', venue_info['url'])

            # Determine category and tags
            tags = ['Music', 'Live Music']
            if 'rock' in name.lower() or 'rock' in description.lower():
                tags.append('Rock')
            if 'punk' in name.lower() or 'punk' in description.lower():
                tags.append('Punk')
            if 'indie' in name.lower() or 'indie' in description.lower():
                tags.append('Indie')

            return Event(
                name=name,
                venue=venue_info['name'],
                category='music',
                description=description,
                location=venue_info['location'],
                date=date_time_info['date'],
                time=date_time_info['time'],
                datetime_display=date_time_info['datetime_display'],
                price=price_display,
                price_numeric=price_numeric,
                price_category=self.categorize_price(price_numeric),
                external_link=url,
                source=venue_info['name'],
                source_url=venue_info['url'],
                scraped_at=datetime.now().isoformat(),
                tags=tags,
                artists=artists,
                capacity='medium',
                venue_type='indoor'
            )

        except Exception as e:
            logger.error(f"Error parsing JSON-LD event: {e}")
            return None

    def _extract_from_html(self, soup: BeautifulSoup, venue_info: Dict) -> List[Event]:
        """Extract events from HTML structure (fallback method)."""
        events = []

        # Look for event containers with various selectors
        selectors = [
            {'class_': re.compile(r'.*event.*', re.I)},
            {'class_': re.compile(r'.*tm-event.*', re.I)},
            {'class_': re.compile(r'.*tribe-event.*', re.I)},
            {'itemtype': 'https://schema.org/Event'},
            {'itemtype': 'http://schema.org/Event'}
        ]

        event_elements = []
        for selector in selectors:
            found = soup.find_all(attrs=selector)
            if found:
                event_elements = found
                break

        for element in event_elements[:20]:  # Limit to first 20 events
            try:
                # Extract event name
                name_tag = element.find(['h2', 'h3', 'h4'], class_=re.compile(r'.*title.*|.*name.*', re.I))
                if not name_tag:
                    name_tag = element.find(['a'], class_=re.compile(r'.*title.*|.*name.*', re.I))
                if not name_tag:
                    continue

                name = name_tag.get_text(strip=True)

                # Extract date/time
                date_elem = element.find(['time', 'span'], class_=re.compile(r'.*date.*', re.I))
                date_str = date_elem.get('datetime', '') if date_elem and date_elem.get('datetime') else ''
                if not date_str and date_elem:
                    date_str = date_elem.get_text(strip=True)

                time_elem = element.find(['time', 'span'], class_=re.compile(r'.*time.*', re.I))
                time_str = time_elem.get_text(strip=True) if time_elem else ''

                date_time_info = self.parse_date_time(date_str, time_str)

                # Extract price
                price_elem = element.find(class_=re.compile(r'.*price.*|.*cost.*', re.I))
                price_text = price_elem.get_text(strip=True) if price_elem else 'Free'
                price_display, price_numeric = self.extract_price(price_text)

                # Extract URL
                link_elem = element.find('a', href=True)
                url = urljoin(venue_info['url'], link_elem['href']) if link_elem else venue_info['url']

                # Extract description
                desc_elem = element.find(class_=re.compile(r'.*description.*|.*excerpt.*', re.I))
                description = desc_elem.get_text(strip=True)[:500] if desc_elem else ''

                event = Event(
                    name=name,
                    venue=venue_info['name'],
                    category='music',
                    description=description,
                    location=venue_info['location'],
                    date=date_time_info['date'],
                    time=date_time_info['time'],
                    datetime_display=date_time_info['datetime_display'],
                    price=price_display,
                    price_numeric=price_numeric,
                    price_category=self.categorize_price(price_numeric),
                    external_link=url,
                    source=venue_info['name'],
                    source_url=venue_info['url'],
                    scraped_at=datetime.now().isoformat(),
                    tags=['Music', 'Live Music'],
                    capacity='medium',
                    venue_type='indoor'
                )

                events.append(event)

            except Exception as e:
                logger.debug(f"Error parsing event element: {e}")
                continue

        return events


class PlazaLiveScraper(EventScraper):
    """Scraper for The Plaza Live."""

    URL = 'https://plazaliveorlando.com/events/'
    NAME = 'The Plaza Live'
    LOCATION = '425 N Bumby Ave, Orlando, FL 32803'

    def scrape(self) -> List[Event]:
        """Scrape events from The Plaza Live."""
        logger.info(f"Scraping {self.NAME}...")
        soup = self.fetch_page(self.URL)

        if not soup:
            return []

        # Try JSON-LD first
        events = self._extract_from_json_ld(soup)

        # Fallback to HTML
        if not events:
            events = self._extract_from_html(soup)

        logger.info(f"Found {len(events)} events at {self.NAME}")
        return events

    def _extract_from_json_ld(self, soup: BeautifulSoup) -> List[Event]:
        """Extract from JSON-LD structured data."""
        events = []
        scripts = soup.find_all('script', type='application/ld+json')

        for script in scripts:
            try:
                data = json.loads(script.string)
                event_list = data if isinstance(data, list) else [data]

                for item in event_list:
                    if item.get('@type') == 'Event':
                        event = self._parse_event(item)
                        if event:
                            events.append(event)
            except:
                continue

        return events

    def _extract_from_html(self, soup: BeautifulSoup) -> List[Event]:
        """Extract from HTML structure."""
        # Implementation depends on actual site structure
        # This is a placeholder that looks for common event patterns
        events = []
        return events

    def _parse_event(self, data: Dict) -> Optional[Event]:
        """Parse event data."""
        try:
            name = data.get('name', '').strip()
            if not name:
                return None

            start_date = data.get('startDate', '')
            date_time_info = self.parse_date_time(start_date)

            offers = data.get('offers', {})
            price_text = offers.get('price', 'TBA') if isinstance(offers, dict) else 'TBA'
            price_display, price_numeric = self.extract_price(str(price_text))

            description = data.get('description', '')[:500]
            url = data.get('url', self.URL)

            performer = data.get('performer', {})
            artists = performer.get('name', '') if isinstance(performer, dict) else ''

            return Event(
                name=name,
                venue=self.NAME,
                category='music',
                description=description,
                location=self.LOCATION,
                date=date_time_info['date'],
                time=date_time_info['time'],
                datetime_display=date_time_info['datetime_display'],
                price=price_display,
                price_numeric=price_numeric,
                price_category=self.categorize_price(price_numeric),
                external_link=url,
                source=self.NAME,
                source_url=self.URL,
                scraped_at=datetime.now().isoformat(),
                tags=['Music', 'Concert'],
                artists=artists,
                capacity='large',
                venue_type='indoor'
            )
        except Exception as e:
            logger.error(f"Error parsing event: {e}")
            return None


class MultiSourceScraper:
    """Coordinates scraping from multiple sources."""

    def __init__(self, delay: float = 1.5):
        """
        Initialize multi-source scraper.

        Args:
            delay: Delay between requests in seconds
        """
        self.delay = delay
        self.scrapers = [
            WillsPubScraper(delay=delay),
            PlazaLiveScraper(delay=delay),
            # Add more scrapers here
        ]
        self.all_events: List[Event] = []

    def scrape_all(self) -> List[Event]:
        """Scrape events from all sources."""
        logger.info("Starting multi-source scraping...")
        self.all_events = []

        for scraper in self.scrapers:
            try:
                events = scraper.scrape()
                self.all_events.extend(events)
                logger.info(f"Collected {len(events)} events from {scraper.__class__.__name__}")
            except Exception as e:
                logger.error(f"Error with {scraper.__class__.__name__}: {e}")
                continue

        logger.info(f"Total events collected: {len(self.all_events)}")
        return self.all_events

    def save_to_json(self, filename: str = 'central_florida_events.json'):
        """Save events to JSON file."""
        data = {
            'scraped_at': datetime.now().isoformat(),
            'total_events': len(self.all_events),
            'events': [event.to_dict() for event in self.all_events]
        }

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(self.all_events)} events to {filename}")

    def save_to_csv(self, filename: str = 'central_florida_events.csv'):
        """Save events to CSV file."""
        if not self.all_events:
            logger.warning("No events to save")
            return

        with open(filename, 'w', newline='', encoding='utf-8') as f:
            # Get all field names from the first event
            fieldnames = list(self.all_events[0].to_dict().keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            for event in self.all_events:
                event_dict = event.to_dict()
                # Convert lists to strings for CSV
                event_dict['tags'] = ', '.join(event_dict['tags'])
                writer.writerow(event_dict)

        logger.info(f"Saved {len(self.all_events)} events to {filename}")

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about scraped events."""
        if not self.all_events:
            return {}

        stats = {
            'total_events': len(self.all_events),
            'by_venue': {},
            'by_category': {},
            'by_price_category': {},
            'date_range': {
                'earliest': None,
                'latest': None
            }
        }

        dates = []
        for event in self.all_events:
            # Count by venue
            venue = event.venue
            stats['by_venue'][venue] = stats['by_venue'].get(venue, 0) + 1

            # Count by category
            category = event.category
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1

            # Count by price category
            price_cat = event.price_category
            stats['by_price_category'][price_cat] = stats['by_price_category'].get(price_cat, 0) + 1

            # Track dates
            if event.date:
                dates.append(event.date)

        if dates:
            stats['date_range']['earliest'] = min(dates)
            stats['date_range']['latest'] = max(dates)

        return stats


def main():
    """Main execution function."""
    logger.info("=" * 60)
    logger.info("Central Florida Multi-Source Event Scraper")
    logger.info("=" * 60)

    # Create scraper with 1.5 second delay between requests
    scraper = MultiSourceScraper(delay=1.5)

    # Scrape all sources
    events = scraper.scrape_all()

    # Save results
    scraper.save_to_json('central_florida_events.json')
    scraper.save_to_csv('central_florida_events.csv')

    # Print statistics
    stats = scraper.get_stats()
    logger.info("\n" + "=" * 60)
    logger.info("SCRAPING STATISTICS")
    logger.info("=" * 60)
    logger.info(f"Total Events: {stats.get('total_events', 0)}")

    if stats.get('by_venue'):
        logger.info("\nEvents by Venue:")
        for venue, count in sorted(stats['by_venue'].items()):
            logger.info(f"  {venue}: {count}")

    if stats.get('by_price_category'):
        logger.info("\nEvents by Price Category:")
        for cat, count in sorted(stats['by_price_category'].items()):
            logger.info(f"  {cat}: {count}")

    if stats.get('date_range', {}).get('earliest'):
        logger.info("\nDate Range:")
        logger.info(f"  Earliest: {stats['date_range']['earliest']}")
        logger.info(f"  Latest: {stats['date_range']['latest']}")

    logger.info("\n" + "=" * 60)
    logger.info("Scraping complete!")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
