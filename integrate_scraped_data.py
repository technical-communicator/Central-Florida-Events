#!/usr/bin/env python3
"""
Data Integration Pipeline for Central Florida Events

Converts scraped event data into the events-data.js format and optionally
merges with existing events.
"""

import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EventDataIntegrator:
    """Integrates scraped event data with existing events database."""

    # Category mapping from scraper to events-data.js format
    CATEGORY_MAP = {
        'music': 'music',
        'arts': 'arts',
        'food': 'food',
        'sports': 'sports',
        'outdoor': 'outdoor',
        'education': 'education',
        'community': 'community',
        'family': 'family'
    }

    # Emoji mapping for different event types/categories
    CATEGORY_EMOJIS = {
        'music': '🎵',
        'arts': '🎨',
        'food': '🍔',
        'sports': '⚽',
        'outdoor': '🌳',
        'education': '📚',
        'community': '🤝',
        'family': '👨‍👩‍👧‍👦'
    }

    # Venue-specific emojis
    VENUE_EMOJIS = {
        "Will's Pub": '🎸',
        'Lil Indies': '🎤',
        'Dirty Laundry': '🎧',
        'The Plaza Live': '🎭',
        'The Beacham': '🎪',
        'The Social': '🎵'
    }

    def __init__(self, scraped_data_file: str = 'central_florida_events.json'):
        """
        Initialize the integrator.

        Args:
            scraped_data_file: Path to scraped events JSON file
        """
        self.scraped_data_file = scraped_data_file
        self.scraped_events = []
        self.integrated_events = []

    def load_scraped_data(self) -> bool:
        """Load scraped event data from JSON file."""
        try:
            with open(self.scraped_data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.scraped_events = data.get('events', [])
                logger.info(f"Loaded {len(self.scraped_events)} scraped events")
                return True
        except FileNotFoundError:
            logger.error(f"File not found: {self.scraped_data_file}")
            return False
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            return False

    def infer_personality_tags(self, event: Dict) -> List[str]:
        """
        Infer MBTI personality tags based on event characteristics.

        Returns list of personality dimensions that would enjoy this event.
        E/I (Extraversion/Introversion)
        S/N (Sensing/Intuition)
        T/F (Thinking/Feeling)
        J/P (Judging/Perceiving)
        """
        tags = []

        # E/I: Social vs Solo activities
        category = event.get('category', '').lower()
        capacity = event.get('capacity', 'medium')
        if category in ['music', 'sports', 'festival'] or capacity == 'large':
            tags.append('E')  # Extraverted - social, energetic events
        else:
            tags.append('I')  # Introverted - quieter, smaller events

        # S/N: Concrete vs Abstract experiences
        if category in ['music', 'food', 'sports']:
            tags.append('S')  # Sensing - experiential, in-the-moment
        else:
            tags.append('N')  # Intuition - abstract, conceptual

        # T/F: Logical vs Emotional appeal
        if category in ['education', 'sports']:
            tags.append('T')  # Thinking - logical, competitive
        else:
            tags.append('F')  # Feeling - emotional, artistic

        # J/P: Structured vs Spontaneous
        if category in ['education', 'arts']:
            tags.append('J')  # Judging - planned, structured
        else:
            tags.append('P')  # Perceiving - spontaneous, flexible

        return tags

    def infer_vibes(self, event: Dict) -> List[str]:
        """Infer event vibes based on characteristics."""
        vibes = []
        category = event.get('category', '').lower()
        price_category = event.get('price_category', 'moderate')
        tags = [t.lower() for t in event.get('tags', [])]

        # Category-based vibes
        vibe_map = {
            'music': ['energetic', 'social'],
            'arts': ['cultural', 'relaxed'],
            'food': ['casual', 'social'],
            'sports': ['energetic', 'competitive'],
            'outdoor': ['adventurous', 'relaxed'],
            'education': ['educational', 'intellectual'],
            'community': ['social', 'meaningful'],
            'family': ['casual', 'wholesome']
        }

        vibes.extend(vibe_map.get(category, ['casual']))

        # Price-based vibes
        if price_category == 'free':
            vibes.append('accessible')
        elif price_category == 'premium':
            vibes.append('upscale')

        # Tag-based vibes
        if any(t in tags for t in ['indie', 'alternative', 'punk']):
            vibes.append('edgy')
        if any(t in tags for t in ['romantic', 'date']):
            vibes.append('romantic')
        if any(t in tags for t in ['party', 'dance', 'club']):
            vibes.append('party')

        return list(set(vibes))[:3]  # Limit to 3 unique vibes

    def infer_group_sizes(self, event: Dict) -> List[str]:
        """Infer suitable group sizes for the event."""
        capacity = event.get('capacity', 'medium')
        category = event.get('category', '').lower()

        group_sizes = ['solo']  # Most events work for solo

        if category in ['food', 'arts', 'outdoor']:
            group_sizes.append('couple')

        if category in ['music', 'sports', 'community', 'family']:
            group_sizes.append('small')

        if capacity == 'large':
            group_sizes.append('large')

        return group_sizes

    def infer_interactivity(self, event: Dict) -> str:
        """Infer event interactivity level."""
        category = event.get('category', '').lower()

        high_interactivity = ['sports', 'education', 'family', 'community']
        low_interactivity = ['arts', 'music']

        if category in high_interactivity:
            return 'high'
        elif category in low_interactivity:
            return 'low'
        else:
            return 'medium'

    def convert_event(self, event: Dict, event_id: int) -> Dict:
        """
        Convert scraped event to events-data.js format.

        Args:
            event: Scraped event dictionary
            event_id: Unique ID for the event

        Returns:
            Converted event dictionary
        """
        # Get emoji for the event
        venue = event.get('venue', '')
        category = event.get('category', 'music')
        emoji = self.VENUE_EMOJIS.get(venue, self.CATEGORY_EMOJIS.get(category, '🎉'))

        # Convert price
        price_numeric = event.get('price_numeric', 0)
        price = int(price_numeric) if price_numeric else 0

        # Infer missing fields
        personality_tags = self.infer_personality_tags(event)
        vibes = self.infer_vibes(event)
        group_sizes = self.infer_group_sizes(event)
        interactivity = self.infer_interactivity(event)

        # Determine duration (default based on category)
        duration_map = {
            'music': '2-3 hours',
            'arts': '1-2 hours',
            'food': '1-2 hours',
            'sports': '2-3 hours',
            'outdoor': '2-4 hours',
            'education': '1-2 hours',
            'community': '2-3 hours',
            'family': '2-4 hours'
        }
        duration = duration_map.get(category, '2-3 hours')

        # Build converted event
        converted = {
            'id': event_id,
            'name': event.get('name', '').strip(),
            'category': self.CATEGORY_MAP.get(category, 'music'),
            'description': event.get('description', '').strip()[:300],  # Limit length
            'location': event.get('location', '').strip(),
            'date': event.get('date', ''),
            'time': self._format_time(event.get('time', '')),
            'price': price,
            'priceCategory': event.get('price_category', 'moderate'),
            'capacity': event.get('capacity', 'medium'),
            'image': emoji,
            'personalityTags': personality_tags,
            'vibes': vibes,
            'groupSizes': group_sizes,
            'interactivity': interactivity,
            'venue': event.get('venue_type', 'indoor'),
            'duration': duration,
            'tags': event.get('tags', [])[:5],  # Limit to 5 tags
            'externalLink': event.get('external_link', ''),
            'source': f"{event.get('source', '')} (Auto-scraped)",
            'scrapedAt': event.get('scraped_at', ''),
            'artists': event.get('artists', '')
        }

        return converted

    def _format_time(self, time_str: str) -> str:
        """Format time string to consistent format."""
        if not time_str:
            return ''

        # If already in HH:MM format, convert to 12-hour with AM/PM
        match = re.match(r'(\d{2}):(\d{2})', time_str)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2))

            am_pm = 'AM' if hour < 12 else 'PM'
            display_hour = hour if hour <= 12 else hour - 12
            if display_hour == 0:
                display_hour = 12

            return f"{display_hour}:{minute:02d} {am_pm}"

        return time_str

    def integrate_events(self, start_id: int = 1000) -> List[Dict]:
        """
        Integrate scraped events with proper formatting.

        Args:
            start_id: Starting ID for scraped events (to avoid conflicts)

        Returns:
            List of integrated events
        """
        self.integrated_events = []
        current_id = start_id

        for event in self.scraped_events:
            try:
                # Skip events with missing required fields
                if not event.get('name') or not event.get('date'):
                    logger.warning(f"Skipping event with missing required fields: {event.get('name', 'Unknown')}")
                    continue

                # Convert event
                converted = self.convert_event(event, current_id)
                self.integrated_events.append(converted)
                current_id += 1

            except Exception as e:
                logger.error(f"Error converting event {event.get('name', 'Unknown')}: {e}")
                continue

        logger.info(f"Successfully integrated {len(self.integrated_events)} events")
        return self.integrated_events

    def save_as_javascript(self, output_file: str = 'scraped-events.js'):
        """Save integrated events as JavaScript file."""
        if not self.integrated_events:
            logger.warning("No events to save")
            return

        # Generate JavaScript file content
        js_content = "// Auto-scraped Central Florida Events\n"
        js_content += f"// Generated: {datetime.now().isoformat()}\n"
        js_content += f"// Total Events: {len(self.integrated_events)}\n\n"
        js_content += "const SCRAPED_EVENTS = [\n"

        for i, event in enumerate(self.integrated_events):
            js_content += "    {\n"
            for key, value in event.items():
                if isinstance(value, str):
                    # Escape quotes in strings
                    escaped_value = value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
                    js_content += f'        {key}: "{escaped_value}",\n'
                elif isinstance(value, list):
                    # Handle arrays
                    if all(isinstance(item, str) for item in value):
                        items = '", "'.join(value)
                        js_content += f'        {key}: ["{items}"],\n'
                    else:
                        js_content += f'        {key}: {json.dumps(value)},\n'
                elif isinstance(value, (int, float)):
                    js_content += f'        {key}: {value},\n'
                elif isinstance(value, bool):
                    js_content += f'        {key}: {str(value).lower()},\n'
                else:
                    js_content += f'        {key}: {json.dumps(value)},\n'

            # Remove trailing comma from last property
            js_content = js_content.rstrip(',\n') + '\n'
            js_content += "    }"

            if i < len(self.integrated_events) - 1:
                js_content += ","

            js_content += "\n"

        js_content += "];\n\n"
        js_content += "// Export for use in app\n"
        js_content += "if (typeof module !== 'undefined' && module.exports) {\n"
        js_content += "    module.exports = SCRAPED_EVENTS;\n"
        js_content += "}\n"

        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)

        logger.info(f"Saved {len(self.integrated_events)} events to {output_file}")

    def save_as_json(self, output_file: str = 'integrated_events.json'):
        """Save integrated events as JSON file."""
        if not self.integrated_events:
            logger.warning("No events to save")
            return

        data = {
            'generated_at': datetime.now().isoformat(),
            'total_events': len(self.integrated_events),
            'events': self.integrated_events
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(self.integrated_events)} events to {output_file}")

    def generate_stats(self) -> Dict[str, Any]:
        """Generate statistics about integrated events."""
        if not self.integrated_events:
            return {}

        stats = {
            'total_events': len(self.integrated_events),
            'by_category': {},
            'by_venue': {},
            'by_price_category': {},
            'date_range': {'earliest': None, 'latest': None}
        }

        dates = []
        for event in self.integrated_events:
            # Count by category
            category = event.get('category', 'unknown')
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1

            # Count by venue type
            venue = event.get('venue', 'unknown')
            stats['by_venue'][venue] = stats['by_venue'].get(venue, 0) + 1

            # Count by price category
            price_cat = event.get('priceCategory', 'unknown')
            stats['by_price_category'][price_cat] = stats['by_price_category'].get(price_cat, 0) + 1

            # Track dates
            if event.get('date'):
                dates.append(event['date'])

        if dates:
            stats['date_range']['earliest'] = min(dates)
            stats['date_range']['latest'] = max(dates)

        return stats


def main():
    """Main execution function."""
    logger.info("=" * 60)
    logger.info("Central Florida Events - Data Integration Pipeline")
    logger.info("=" * 60)

    # Initialize integrator
    integrator = EventDataIntegrator('central_florida_events.json')

    # Load scraped data
    if not integrator.load_scraped_data():
        logger.error("Failed to load scraped data. Exiting.")
        return

    # Integrate events
    integrator.integrate_events(start_id=1000)

    # Save in both formats
    integrator.save_as_javascript('scraped-events.js')
    integrator.save_as_json('integrated_events.json')

    # Print statistics
    stats = integrator.generate_stats()
    logger.info("\n" + "=" * 60)
    logger.info("INTEGRATION STATISTICS")
    logger.info("=" * 60)
    logger.info(f"Total Integrated Events: {stats.get('total_events', 0)}")

    if stats.get('by_category'):
        logger.info("\nEvents by Category:")
        for cat, count in sorted(stats['by_category'].items()):
            logger.info(f"  {cat}: {count}")

    if stats.get('by_price_category'):
        logger.info("\nEvents by Price Category:")
        for cat, count in sorted(stats['by_price_category'].items()):
            logger.info(f"  {cat}: {count}")

    if stats.get('date_range', {}).get('earliest'):
        logger.info("\nDate Range:")
        logger.info(f"  Earliest: {stats['date_range']['earliest']}")
        logger.info(f"  Latest: {stats['date_range']['latest']}")

    logger.info("\n" + "=" * 60)
    logger.info("Integration complete!")
    logger.info("Files generated:")
    logger.info("  - scraped-events.js (JavaScript format)")
    logger.info("  - integrated_events.json (JSON format)")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
