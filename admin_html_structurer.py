#!/usr/bin/env python3
"""
Admin HTML Data Structurer for Central Florida Events

This script fetches and structures HTML data from select event sources
for import into the administrator portal. It supports multiple parsing
strategies and can be easily extended with new source configurations.

Usage:
    python admin_html_structurer.py [source_name] [--output FILE] [--all]

Examples:
    python admin_html_structurer.py orange-county-parks
    python admin_html_structurer.py plaza-live --output events.json
    python admin_html_structurer.py --all
"""

import re
import json
import argparse
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from abc import ABC, abstractmethod
import requests
from bs4 import BeautifulSoup
import time


@dataclass
class Event:
    """Standard event data structure matching app.js schema"""
    name: str
    venue: str
    category: str
    description: str
    location: str
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM or morning/afternoon/evening/night
    duration: str
    price: float
    priceCategory: str  # free|budget|moderate|premium
    capacity: str  # small|medium|large
    image: str  # emoji
    personalityTags: List[str]
    vibes: List[str]
    tags: List[str]
    externalLink: str
    source: str
    sourceUrl: str
    contactEmail: Optional[str] = None
    userSubmitted: bool = False
    submittedAt: str = ""
    status: str = "pending"
    artists: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {k: v for k, v in asdict(self).items() if v is not None}


class SourceParser(ABC):
    """Abstract base class for event source parsers"""

    def __init__(self, source_name: str, base_url: str, location: str):
        self.source_name = source_name
        self.base_url = base_url
        self.location = location
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a web page"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'lxml')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    @abstractmethod
    def scrape(self) -> List[Event]:
        """Scrape events from the source"""
        pass

    def extract_price(self, price_text: str) -> float:
        """Extract numeric price from text"""
        if not price_text:
            return 0.0

        # Handle free events
        if re.search(r'\b(free|no charge|complimentary)\b', price_text, re.I):
            return 0.0

        # Extract first numeric value
        match = re.search(r'\$?(\d+(?:\.\d{2})?)', price_text)
        return float(match.group(1)) if match else 0.0

    def categorize_price(self, price: float) -> str:
        """Categorize price into app tiers"""
        if price == 0:
            return "free"
        elif price < 20:
            return "budget"
        elif price < 50:
            return "moderate"
        else:
            return "premium"

    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats to YYYY-MM-DD"""
        if not date_str:
            return None

        # Common date patterns
        patterns = [
            (r'(\d{4})-(\d{2})-(\d{2})', '%Y-%m-%d'),  # 2025-01-15
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', '%m/%d/%Y'),  # 01/15/2025
            (r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', '%B %d %Y'),  # January 15, 2025
            (r'(\w{3})\s+(\d{1,2}),?\s+(\d{4})', '%b %d %Y'),  # Jan 15, 2025
        ]

        for pattern, fmt in patterns:
            try:
                if match := re.search(pattern, date_str):
                    if fmt == '%Y-%m-%d':
                        return match.group(0)
                    else:
                        # Parse and reformat
                        parsed = datetime.strptime(match.group(0), fmt)
                        return parsed.strftime('%Y-%m-%d')
            except:
                continue

        return None

    def extract_from_json_ld(self, soup: BeautifulSoup) -> List[Event]:
        """Extract events from JSON-LD structured data"""
        events = []

        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)

                # Handle single event or list of events
                items = data if isinstance(data, list) else [data]

                for item in items:
                    if item.get('@type') == 'Event':
                        events.append(self._create_event_from_json_ld(item))
            except Exception as e:
                print(f"Error parsing JSON-LD: {e}")
                continue

        return events

    def _create_event_from_json_ld(self, data: Dict) -> Event:
        """Create Event from JSON-LD data"""
        # Extract location
        location = self.location
        if loc := data.get('location'):
            if isinstance(loc, dict):
                address = loc.get('address', {})
                if isinstance(address, str):
                    location = address
                elif isinstance(address, dict):
                    location = f"{address.get('streetAddress', '')}, {address.get('addressLocality', '')}, FL"

        # Extract date/time
        start = data.get('startDate', '')
        date_str = start.split('T')[0] if 'T' in start else start
        time_str = start.split('T')[1][:5] if 'T' in start else 'evening'

        # Extract price
        price = 0.0
        if offers := data.get('offers'):
            if isinstance(offers, dict):
                price = self.extract_price(str(offers.get('price', 0)))
            elif isinstance(offers, list) and offers:
                price = self.extract_price(str(offers[0].get('price', 0)))

        # Extract venue
        venue = self.source_name
        if performer := data.get('performer'):
            if isinstance(performer, dict):
                venue = performer.get('name', venue)
        if loc := data.get('location'):
            if isinstance(loc, dict):
                venue = loc.get('name', venue)

        return Event(
            name=data.get('name', 'Untitled Event'),
            venue=venue,
            category=self._infer_category(data.get('name', '')),
            description=data.get('description', '')[:500],
            location=location,
            date=date_str,
            time=time_str,
            duration='2-3 hours',
            price=price,
            priceCategory=self.categorize_price(price),
            capacity='medium',
            image='🎭',
            personalityTags=[],
            vibes=[],
            tags=[],
            externalLink=data.get('url', self.base_url),
            source=self.source_name,
            sourceUrl=self.base_url,
            submittedAt=datetime.now().isoformat(),
            status='pending'
        )

    def _infer_category(self, text: str) -> str:
        """Infer event category from text"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['concert', 'music', 'band', 'dj', 'jazz', 'rock']):
            return 'music'
        elif any(word in text_lower for word in ['food', 'restaurant', 'dining', 'tasting', 'brunch']):
            return 'food'
        elif any(word in text_lower for word in ['art', 'gallery', 'exhibit', 'museum', 'theater', 'play']):
            return 'arts'
        elif any(word in text_lower for word in ['sports', 'game', 'match', 'race', 'tournament']):
            return 'sports'
        elif any(word in text_lower for word in ['outdoor', 'park', 'hike', 'nature', 'trail']):
            return 'outdoor'
        elif any(word in text_lower for word in ['workshop', 'class', 'seminar', 'education', 'learning']):
            return 'education'
        else:
            return 'community'


class OrangeCountyParksParser(SourceParser):
    """Parser for Orange County Parks & Recreation events"""

    def __init__(self):
        super().__init__(
            source_name="Orange County Parks",
            base_url="https://www.ocfl.net/CivicAlerts.aspx?AID=2467",
            location="Orange County, FL"
        )

    def scrape(self) -> List[Event]:
        """Scrape Orange County Parks events"""
        soup = self.fetch_page(self.base_url)
        if not soup:
            return []

        events = []

        # Try JSON-LD first
        events.extend(self.extract_from_json_ld(soup))

        # Fallback: Parse HTML structure
        # Orange County uses various div structures for events
        for event_div in soup.select('.civic-alert-item, .event-item, article'):
            try:
                title_elem = event_div.find(['h2', 'h3', 'h4', 'a'])
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                description = event_div.get_text(strip=True)[:500]

                # Try to extract date
                date_match = re.search(r'(\w+\s+\d{1,2},?\s+\d{4})', description)
                date_str = self.parse_date(date_match.group(1)) if date_match else None

                if not date_str:
                    continue

                link = title_elem.get('href', self.base_url)
                if link and not link.startswith('http'):
                    link = f"https://www.ocfl.net{link}"

                events.append(Event(
                    name=title,
                    venue="Orange County Parks",
                    category=self._infer_category(title + ' ' + description),
                    description=description,
                    location=self.location,
                    date=date_str,
                    time='afternoon',
                    duration='2-3 hours',
                    price=0.0,
                    priceCategory='free',
                    capacity='large',
                    image='🏞️',
                    personalityTags=['E', 'S', 'F', 'P'],
                    vibes=['family-friendly', 'outdoor', 'relaxed'],
                    tags=['parks', 'outdoor', 'community'],
                    externalLink=link,
                    source=self.source_name,
                    sourceUrl=self.base_url,
                    submittedAt=datetime.now().isoformat(),
                    status='pending'
                ))
            except Exception as e:
                print(f"Error parsing event: {e}")
                continue

        return events


class PlazaLiveParser(SourceParser):
    """Parser for The Plaza Live events"""

    def __init__(self):
        super().__init__(
            source_name="The Plaza Live",
            base_url="https://plazaliveorlando.com/events/",
            location="425 N Bumby Ave, Orlando, FL 32803"
        )

    def scrape(self) -> List[Event]:
        """Scrape The Plaza Live events"""
        soup = self.fetch_page(self.base_url)
        if not soup:
            return []

        events = []

        # Try JSON-LD first
        events.extend(self.extract_from_json_ld(soup))

        # Fallback: Parse event listings
        for event_elem in soup.select('.event, .eventlist-event, article[class*="event"]'):
            try:
                title_elem = event_elem.find(['h2', 'h3', 'h1', 'a'])
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)

                # Extract description
                desc_elem = event_elem.find(['p', 'div'], class_=re.compile(r'description|excerpt|summary'))
                description = desc_elem.get_text(strip=True)[:500] if desc_elem else title

                # Extract date
                date_elem = event_elem.find(['time', 'span', 'div'], class_=re.compile(r'date|time'))
                date_str = None
                if date_elem:
                    date_str = self.parse_date(date_elem.get_text())
                    if not date_str and date_elem.get('datetime'):
                        date_str = self.parse_date(date_elem.get('datetime'))

                if not date_str:
                    continue

                # Extract price
                price_elem = event_elem.find(text=re.compile(r'\$\d+'))
                price = self.extract_price(price_elem) if price_elem else 25.0

                # Extract link
                link_elem = event_elem.find('a', href=True)
                link = link_elem['href'] if link_elem else self.base_url
                if link and not link.startswith('http'):
                    link = f"https://plazaliveorlando.com{link}"

                events.append(Event(
                    name=title,
                    venue="The Plaza Live",
                    category='music',
                    description=description,
                    location=self.location,
                    date=date_str,
                    time='20:00',
                    duration='2-3 hours',
                    price=price,
                    priceCategory=self.categorize_price(price),
                    capacity='medium',
                    image='🎸',
                    personalityTags=['E', 'N', 'F', 'P'],
                    vibes=['energetic', 'creative', 'social'],
                    tags=['live music', 'concert', 'venue'],
                    externalLink=link,
                    source=self.source_name,
                    sourceUrl=self.base_url,
                    submittedAt=datetime.now().isoformat(),
                    status='pending',
                    artists=title
                ))
            except Exception as e:
                print(f"Error parsing event: {e}")
                continue

        return events


class BeachamSocialParser(SourceParser):
    """Parser for The Beacham & The Social events"""

    def __init__(self):
        super().__init__(
            source_name="The Beacham & The Social",
            base_url="https://thebeacham.com/events/",
            location="46 N Orange Ave, Orlando, FL 32801"
        )

    def scrape(self) -> List[Event]:
        """Scrape The Beacham & The Social events"""
        soup = self.fetch_page(self.base_url)
        if not soup:
            return []

        events = []

        # Try JSON-LD first
        events.extend(self.extract_from_json_ld(soup))

        # Parse event listings (similar structure to Plaza Live)
        for event_elem in soup.select('.event, .list-view-item, .rhino-event-item'):
            try:
                title_elem = event_elem.find(['h2', 'h3', 'a'])
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)

                # Determine venue from title or class
                venue = "The Beacham"
                if 'social' in title.lower() or 'the-social' in str(event_elem.get('class', [])):
                    venue = "The Social"

                # Extract date
                date_elem = event_elem.find(['time', 'span'], class_=re.compile(r'date'))
                date_str = None
                if date_elem:
                    date_str = self.parse_date(date_elem.get_text())

                if not date_str:
                    continue

                # Extract price
                price_elem = event_elem.find(text=re.compile(r'\$\d+'))
                price = self.extract_price(price_elem) if price_elem else 20.0

                # Extract link
                link_elem = event_elem.find('a', href=True)
                link = link_elem['href'] if link_elem else self.base_url
                if link and not link.startswith('http'):
                    link = f"https://thebeacham.com{link}"

                events.append(Event(
                    name=title,
                    venue=venue,
                    category='music',
                    description=f"Live music event at {venue}",
                    location=self.location,
                    date=date_str,
                    time='21:00',
                    duration='3-4 hours',
                    price=price,
                    priceCategory=self.categorize_price(price),
                    capacity='large',
                    image='🎤',
                    personalityTags=['E', 'N', 'T', 'P'],
                    vibes=['energetic', 'nightlife', 'social'],
                    tags=['live music', 'nightlife', 'downtown'],
                    externalLink=link,
                    source=self.source_name,
                    sourceUrl=self.base_url,
                    submittedAt=datetime.now().isoformat(),
                    status='pending',
                    artists=title
                ))
            except Exception as e:
                print(f"Error parsing event: {e}")
                continue

        return events


class MyCentralFloridaFamilyParser(SourceParser):
    """Parser for MyCentralFloridaFamily.com events"""

    def __init__(self):
        super().__init__(
            source_name="MyCentralFloridaFamily",
            base_url="https://mycentralfloridafamily.com/things-to-do/events/",
            location="Central Florida"
        )

    def scrape(self) -> List[Event]:
        """Scrape family events"""
        soup = self.fetch_page(self.base_url)
        if not soup:
            return []

        events = []

        # Try JSON-LD first
        events.extend(self.extract_from_json_ld(soup))

        # Parse event articles
        for event_elem in soup.select('article, .event-item, .tribe-event'):
            try:
                title_elem = event_elem.find(['h2', 'h3', 'a'])
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)

                # Extract description
                desc_elem = event_elem.find(['p', 'div'], class_=re.compile(r'description|excerpt'))
                description = desc_elem.get_text(strip=True)[:500] if desc_elem else title

                # Extract date
                date_elem = event_elem.find(['time', 'span'], class_=re.compile(r'date'))
                date_str = None
                if date_elem:
                    date_str = self.parse_date(date_elem.get_text())

                if not date_str:
                    continue

                # Extract link
                link_elem = event_elem.find('a', href=True)
                link = link_elem['href'] if link_elem else self.base_url

                # Most family events are free or budget
                price = 0.0
                if '$' in description:
                    price = self.extract_price(description)

                events.append(Event(
                    name=title,
                    venue="Various Locations",
                    category=self._infer_category(title + ' ' + description),
                    description=description,
                    location="Central Florida",
                    date=date_str,
                    time='afternoon',
                    duration='2-3 hours',
                    price=price,
                    priceCategory=self.categorize_price(price),
                    capacity='medium',
                    image='👨‍👩‍👧‍👦',
                    personalityTags=['E', 'S', 'F', 'J'],
                    vibes=['family-friendly', 'educational', 'fun'],
                    tags=['family', 'kids', 'community'],
                    externalLink=link,
                    source=self.source_name,
                    sourceUrl=self.base_url,
                    submittedAt=datetime.now().isoformat(),
                    status='pending'
                ))
            except Exception as e:
                print(f"Error parsing event: {e}")
                continue

        return events


# Source registry
AVAILABLE_SOURCES = {
    'orange-county-parks': OrangeCountyParksParser,
    'plaza-live': PlazaLiveParser,
    'beacham-social': BeachamSocialParser,
    'mycfl-family': MyCentralFloridaFamilyParser,
}


def scrape_source(source_name: str) -> List[Event]:
    """Scrape events from a specific source"""
    if source_name not in AVAILABLE_SOURCES:
        print(f"Unknown source: {source_name}")
        print(f"Available sources: {', '.join(AVAILABLE_SOURCES.keys())}")
        return []

    parser_class = AVAILABLE_SOURCES[source_name]
    parser = parser_class()

    print(f"Scraping {parser.source_name}...")
    events = parser.scrape()
    print(f"Found {len(events)} events")

    # Rate limiting
    time.sleep(2)

    return events


def scrape_all_sources() -> List[Event]:
    """Scrape events from all available sources"""
    all_events = []

    for source_name in AVAILABLE_SOURCES.keys():
        events = scrape_source(source_name)
        all_events.extend(events)

    return all_events


def save_events(events: List[Event], output_file: str):
    """Save events to JSON file in admin portal format"""
    # Convert events to dictionaries
    events_data = [event.to_dict() for event in events]

    # Add metadata
    output = {
        'scraped_at': datetime.now().isoformat(),
        'total_events': len(events),
        'events': events_data
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved {len(events)} events to {output_file}")
    print(f"\nTo import into admin portal:")
    print(f"1. Open the administrator panel")
    print(f"2. Go to the Manual Scrape tab")
    print(f"3. Copy the 'events' array from {output_file}")
    print(f"4. Paste into the HTML input and click 'Parse HTML'")


def main():
    parser = argparse.ArgumentParser(
        description='Structure HTML data from event sources for admin portal'
    )
    parser.add_argument(
        'source',
        nargs='?',
        choices=list(AVAILABLE_SOURCES.keys()) + ['all'],
        help='Event source to scrape (or "all" for all sources)'
    )
    parser.add_argument(
        '--output', '-o',
        default='admin_structured_events.json',
        help='Output JSON file (default: admin_structured_events.json)'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Scrape all available sources'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='List all available sources'
    )

    args = parser.parse_args()

    # List sources
    if args.list:
        print("Available event sources:")
        for name, parser_class in AVAILABLE_SOURCES.items():
            p = parser_class()
            print(f"  • {name:25} - {p.source_name}")
            print(f"    {p.base_url}")
        return

    # Require source or --all
    if not args.source and not args.all:
        parser.print_help()
        print(f"\nAvailable sources: {', '.join(AVAILABLE_SOURCES.keys())}")
        return

    # Scrape events
    if args.all or args.source == 'all':
        events = scrape_all_sources()
    else:
        events = scrape_source(args.source)

    # Save results
    if events:
        save_events(events, args.output)
    else:
        print("No events found")


if __name__ == '__main__':
    main()
