# Admin HTML Structurer Guide

## Overview

The `admin_html_structurer.py` script automates the process of fetching and structuring HTML data from select event sources for import into the Central Florida Events administrator portal. It supports multiple parsing strategies and can be easily extended with new source configurations.

## Features

✅ **Multiple Parsing Strategies**
- JSON-LD structured data extraction (primary method)
- HTML pattern matching (fallback method)
- Source-specific custom parsers

✅ **Pre-configured Event Sources**
- Orange County Parks & Recreation
- The Plaza Live
- The Beacham & The Social
- MyCentralFloridaFamily.com

✅ **Standardized Output**
- Matches the app's event data schema
- Ready for direct import into admin panel
- Includes all required fields (name, venue, category, date, price, etc.)

✅ **Extensible Architecture**
- Easy to add new sources
- Abstract base class for consistent parsing
- Modular design

---

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `requests` - HTTP requests
- `beautifulsoup4` - HTML parsing
- `lxml` - Fast XML/HTML parser

### 2. Verify Installation

```bash
python3 admin_html_structurer.py --list
```

You should see a list of available event sources.

---

## Usage

### List Available Sources

```bash
python3 admin_html_structurer.py --list
```

Output:
```
Available event sources:
  • orange-county-parks       - Orange County Parks
    https://www.ocfl.net/CivicAlerts.aspx?AID=2467
  • plaza-live                - The Plaza Live
    https://plazaliveorlando.com/events/
  • beacham-social            - The Beacham & The Social
    https://thebeacham.com/events/
  • mycfl-family              - MyCentralFloridaFamily
    https://mycentralfloridafamily.com/things-to-do/events/
```

### Scrape a Specific Source

```bash
python3 admin_html_structurer.py orange-county-parks
```

This will:
1. Fetch HTML from Orange County Parks event page
2. Extract event data using JSON-LD and HTML parsing
3. Save structured events to `admin_structured_events.json`

### Scrape All Sources

```bash
python3 admin_html_structurer.py --all
```

Or:

```bash
python3 admin_html_structurer.py all
```

This scrapes all configured sources and combines the results.

### Custom Output File

```bash
python3 admin_html_structurer.py plaza-live --output my_events.json
```

### Example Output

The script generates a JSON file with this structure:

```json
{
  "scraped_at": "2025-11-11T10:30:00",
  "total_events": 15,
  "events": [
    {
      "name": "Jazz Night at The Plaza",
      "venue": "The Plaza Live",
      "category": "music",
      "description": "Live jazz performance featuring local artists",
      "location": "425 N Bumby Ave, Orlando, FL 32803",
      "date": "2025-11-15",
      "time": "20:00",
      "duration": "2-3 hours",
      "price": 25.0,
      "priceCategory": "moderate",
      "capacity": "medium",
      "image": "🎸",
      "personalityTags": ["E", "N", "F", "P"],
      "vibes": ["energetic", "creative", "social"],
      "tags": ["live music", "concert", "venue"],
      "externalLink": "https://plazaliveorlando.com/events/jazz-night",
      "source": "The Plaza Live",
      "sourceUrl": "https://plazaliveorlando.com/events/",
      "submittedAt": "2025-11-11T10:30:00",
      "status": "pending"
    }
  ]
}
```

---

## Importing into Admin Portal

### Method 1: Manual Import (Recommended)

1. **Run the script**:
   ```bash
   python3 admin_html_structurer.py plaza-live
   ```

2. **Open the administrator portal**:
   - Navigate to your app in a browser
   - Click "Admin" in the top navigation
   - Enter admin password (default: `admin123`)

3. **Go to Manual Scrape tab**:
   - Click on the "Manual Scrape" tab in the admin panel

4. **Copy the events array**:
   - Open `admin_structured_events.json`
   - Copy the entire `events` array (the list inside the "events" field)

5. **Create HTML script tag**:
   - In the admin portal's HTML input box, paste:
   ```html
   <script type="application/ld+json">
   [
     {
       "@type": "Event",
       "name": "Event Name",
       ...
     }
   ]
   </script>
   ```
   - Or paste the JSON events directly and the parser will handle it

6. **Parse and review**:
   - Click "Parse HTML"
   - Review the extracted events
   - Edit any events as needed
   - Use "Approve All" or approve individually

### Method 2: Direct JSON Import (Alternative)

For bulk imports, you can also:

1. Copy events from the JSON file
2. Manually add them to `events-data.js`
3. Or use the existing `integrate_scraped_data.py` script

---

## How It Works

### Parsing Strategy

The script uses a multi-layered parsing approach:

```
1. Fetch HTML page
   ↓
2. Try JSON-LD extraction (Schema.org Event data)
   ↓
3. If no JSON-LD found, use HTML pattern matching
   ↓
4. Apply source-specific parsing rules
   ↓
5. Normalize data to app schema
   ↓
6. Save as structured JSON
```

### Data Normalization

All sources are normalized to match the app's event schema:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Event title |
| `venue` | string | Venue name |
| `category` | enum | music/food/sports/arts/outdoor/education/community |
| `description` | string | Event description (max 500 chars) |
| `location` | string | Full address |
| `date` | string | YYYY-MM-DD format |
| `time` | string | HH:MM or morning/afternoon/evening/night |
| `duration` | string | e.g., "2-3 hours" |
| `price` | number | Numeric price |
| `priceCategory` | enum | free/budget/moderate/premium |
| `capacity` | enum | small/medium/large |
| `image` | string | Emoji icon |
| `personalityTags` | array | MBTI tags [E/I, S/N, T/F, J/P] |
| `vibes` | array | Vibe keywords |
| `tags` | array | Searchable tags |
| `externalLink` | string | Event URL |
| `source` | string | Source name |
| `sourceUrl` | string | Source homepage |
| `status` | enum | pending/approved/rejected |

---

## Adding New Sources

### Step 1: Create a Parser Class

Create a new parser class that extends `SourceParser`:

```python
class MyVenueParser(SourceParser):
    """Parser for My Venue events"""

    def __init__(self):
        super().__init__(
            source_name="My Venue Name",
            base_url="https://myvenue.com/events",
            location="123 Main St, Orlando, FL 32801"
        )

    def scrape(self) -> List[Event]:
        """Scrape events from My Venue"""
        soup = self.fetch_page(self.base_url)
        if not soup:
            return []

        events = []

        # Try JSON-LD first
        events.extend(self.extract_from_json_ld(soup))

        # Add custom parsing logic here
        for event_elem in soup.select('.event-item'):
            # Extract event data
            title = event_elem.find('h2').get_text(strip=True)
            date_str = self.parse_date(event_elem.find('.date').get_text())

            # Create Event object
            events.append(Event(
                name=title,
                venue="My Venue",
                category='music',
                description='...',
                location=self.location,
                date=date_str,
                time='20:00',
                duration='2-3 hours',
                price=25.0,
                priceCategory='moderate',
                capacity='medium',
                image='🎵',
                personalityTags=['E', 'N', 'F', 'P'],
                vibes=['energetic'],
                tags=['live music'],
                externalLink=self.base_url,
                source=self.source_name,
                sourceUrl=self.base_url,
                submittedAt=datetime.now().isoformat(),
                status='pending'
            ))

        return events
```

### Step 2: Register the Parser

Add your parser to the `AVAILABLE_SOURCES` dictionary:

```python
AVAILABLE_SOURCES = {
    'orange-county-parks': OrangeCountyParksParser,
    'plaza-live': PlazaLiveParser,
    'beacham-social': BeachamSocialParser,
    'mycfl-family': MyCentralFloridaFamilyParser,
    'my-venue': MyVenueParser,  # Add your parser here
}
```

### Step 3: Test Your Parser

```bash
python3 admin_html_structurer.py my-venue
```

### Helpful Methods

The `SourceParser` base class provides useful methods:

- `fetch_page(url)` - Fetch and parse HTML
- `extract_from_json_ld(soup)` - Extract JSON-LD events
- `extract_price(text)` - Extract numeric price from text
- `categorize_price(price)` - Categorize as free/budget/moderate/premium
- `parse_date(date_str)` - Convert various date formats to YYYY-MM-DD
- `_infer_category(text)` - Infer event category from text

---

## Tips & Best Practices

### 1. Respect Rate Limits

The script includes a 2-second delay between requests. Increase if needed:

```python
time.sleep(5)  # 5 second delay
```

### 2. Check robots.txt

Before scraping a new source, verify it's allowed:

```bash
curl https://example.com/robots.txt
```

### 3. Handle Errors Gracefully

The script continues even if one source fails. Check output for errors:

```
Scraping Orange County Parks...
Error fetching https://...: Connection timeout
Found 0 events
```

### 4. Validate Data

Always review extracted events in the admin panel before approving:
- Check dates are formatted correctly
- Verify prices are accurate
- Ensure descriptions are complete
- Validate external links work

### 5. Schedule Regular Scrapes

For automated updates, schedule the script with cron:

```bash
# Run daily at 6 AM
0 6 * * * cd /path/to/project && python3 admin_html_structurer.py --all
```

---

## Troubleshooting

### No Events Found

**Possible causes:**
1. Website structure changed → Update parser selectors
2. No upcoming events → Normal, try again later
3. Network error → Check internet connection
4. Anti-scraping measures → Use API if available

**Solution:** Run with increased verbosity to see errors.

### Invalid Date Format

**Error:** Events appear but dates are `None`

**Solution:** Check the date parsing regex patterns in `parse_date()` method. Add new patterns if needed:

```python
patterns = [
    (r'(\d{4})-(\d{2})-(\d{2})', '%Y-%m-%d'),
    (r'your-custom-pattern', '%your-format'),
]
```

### Missing Dependencies

**Error:** `ModuleNotFoundError: No module named 'bs4'`

**Solution:**
```bash
pip3 install -r requirements.txt
```

### Import Fails in Admin Panel

**Possible issues:**
1. JSON format is incorrect → Validate with `python3 -m json.tool events.json`
2. Events array is malformed → Check brackets and commas
3. Required fields missing → Verify all required fields are present

---

## Source Priority

Based on `EVENT_SOURCES.md`, prioritize these sources:

### ✅ Tier 1 (Implemented)
- Orange County Parks & Recreation
- The Plaza Live
- The Beacham & The Social
- MyCentralFloridaFamily.com

### 🔄 Tier 2 (Recommended Next)
- Dr. Phillips Center for the Performing Arts
- Orlando Weekly Events
- Orlando Sentinel Events
- Enzian Theater
- Stardust Video & Coffee

### 🔴 Tier 3 (Use APIs Instead)
- Eventbrite (use API)
- Facebook Events (use Graph API)
- Meetup (use API)
- Ticketmaster (use API)

---

## Related Scripts

- `multi_source_scraper.py` - Multi-source scraper with modular architecture
- `wills_pub_scraper.py` - Specific scraper for Will's Pub venues
- `integrate_scraped_data.py` - Data integration pipeline
- `manual_scrape_helper.py` - CLI tool to fetch HTML

---

## Support

For issues or questions:
1. Check this guide first
2. Review `EVENT_SOURCES.md` for source details
3. Check `MANUAL_SCRAPE_GUIDE.md` for manual scraping workflow
4. Review example output files in the repository

---

## License

This script is part of the Central Florida Events project.
