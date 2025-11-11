# Central Florida Events - Automated Scraping System

## 📋 Overview

This automated scraping system continuously updates the Central Florida Events database with fresh event data from multiple scraper-friendly sources across the region. The system runs daily via GitHub Actions and integrates scraped events into a format compatible with the Search Central Florida application.

## 🎯 Key Features

- **Multi-Source Scraping**: Collects events from multiple Central Florida venues
- **Daily Automation**: Runs automatically every day at 6 AM UTC (2 AM EST)
- **Respectful Scraping**: Implements rate limiting and respects robots.txt
- **Data Integration**: Converts scraped data to app-compatible format
- **Continuous Updates**: Automatically commits new events to the repository
- **Source Tracking**: Maintains comprehensive list of accessible event sources

## 📁 System Components

### 1. **EVENT_SOURCES.md**
Comprehensive database of Central Florida event sources, categorized by scraping accessibility:
- 🟢 **High Accessibility**: Scraper-friendly sources (24+ sources)
- 🟡 **Medium Accessibility**: Sources with structured data
- 🔴 **Low Accessibility**: Sources requiring APIs

**Key Sources Currently Enabled:**
- Will's Pub Venues (Will's Pub, Lil Indies, Dirty Laundry)
- The Plaza Live
- Orange County Parks & Recreation
- Orange County Arts & Culture Calendar
- And more...

### 2. **multi_source_scraper.py**
Main scraping engine with modular architecture:
- Base `EventScraper` class for easy source addition
- `WillsPubScraper`: Scrapes Will's Pub venues
- `PlazaLiveScraper`: Scrapes The Plaza Live
- `MultiSourceScraper`: Coordinates all scrapers

**Features:**
- JSON-LD structured data extraction
- Fallback HTML parsing
- Configurable rate limiting (1.5s default)
- Multiple output formats (JSON, CSV)
- Comprehensive error handling

### 3. **integrate_scraped_data.py**
Data integration pipeline that converts scraped events to app format:
- Converts to events-data.js structure
- Infers missing fields (personality tags, vibes, etc.)
- Generates JavaScript and JSON outputs
- Provides integration statistics

**Outputs:**
- `scraped-events.js`: JavaScript format for direct app integration
- `integrated_events.json`: JSON format for analysis

### 4. **GitHub Actions Workflow**
`.github/workflows/scrape-events.yml` - Automated daily execution:
- Runs daily at 6 AM UTC
- Can be manually triggered via workflow_dispatch
- Commits new events automatically
- Uploads artifacts for download
- Creates issues on failure

## 🚀 How It Works

### Automated Daily Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. GitHub Actions triggers at 6 AM UTC                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Run multi_source_scraper.py                         │
│    - Scrape Will's Pub venues                          │
│    - Scrape Plaza Live                                 │
│    - Scrape additional sources                         │
│    - Generate central_florida_events.json & .csv       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Run integrate_scraped_data.py                       │
│    - Convert to events-data.js format                  │
│    - Infer personality tags, vibes, etc.               │
│    - Generate scraped-events.js & integrated_events.json│
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Commit and Push Changes                             │
│    - Auto-commit all generated files                   │
│    - Push to current branch                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Website automatically updates with new events!      │
└─────────────────────────────────────────────────────────┘
```

### Manual Execution

You can also run the scrapers manually:

```bash
# Run the multi-source scraper
python multi_source_scraper.py

# Integrate the scraped data
python integrate_scraped_data.py

# Or run both in sequence
python multi_source_scraper.py && python integrate_scraped_data.py
```

## 📦 Installation & Setup

### Prerequisites

```bash
# Python 3.11+ required
python --version

# Install dependencies
pip install -r requirements.txt
```

### Required Dependencies

```txt
requests>=2.31.0       # HTTP requests
beautifulsoup4>=4.12.0 # HTML parsing
lxml>=4.9.0           # XML/HTML parser
```

## 🎛️ Configuration

### Scraping Rate Limits

Edit `multi_source_scraper.py`:

```python
# Adjust delay between requests (in seconds)
scraper = MultiSourceScraper(delay=1.5)  # Default: 1.5s
```

### Starting ID for Scraped Events

Edit `integrate_scraped_data.py`:

```python
# Set starting ID to avoid conflicts with manual events
integrator.integrate_events(start_id=1000)  # Default: 1000
```

### GitHub Actions Schedule

Edit `.github/workflows/scrape-events.yml`:

```yaml
on:
  schedule:
    # Current: Daily at 6 AM UTC (2 AM EST)
    - cron: '0 6 * * *'

    # Examples:
    # Every 12 hours: '0 */12 * * *'
    # Twice daily (6 AM & 6 PM): '0 6,18 * * *'
    # Weekly on Monday: '0 6 * * 1'
```

## 📊 Output Files

### Generated Files

| File | Format | Description |
|------|--------|-------------|
| `central_florida_events.json` | JSON | Raw scraped event data with metadata |
| `central_florida_events.csv` | CSV | Spreadsheet-compatible event data |
| `scraped-events.js` | JavaScript | App-compatible JavaScript constant |
| `integrated_events.json` | JSON | Integrated events with inferred fields |

### File Structure

#### central_florida_events.json
```json
{
  "scraped_at": "2025-11-11T06:00:00Z",
  "total_events": 42,
  "events": [
    {
      "name": "Event Name",
      "venue": "Will's Pub",
      "category": "music",
      "date": "2025-11-15",
      "time": "20:00",
      "price": "$15",
      "price_numeric": 15.0,
      "external_link": "https://...",
      "source": "Will's Pub",
      ...
    }
  ]
}
```

#### scraped-events.js
```javascript
const SCRAPED_EVENTS = [
    {
        id: 1000,
        name: "Event Name",
        category: "music",
        description: "Event description...",
        location: "1042 N Mills Ave, Orlando, FL 32803",
        date: "2025-11-15",
        time: "8:00 PM",
        price: 15,
        priceCategory: "budget",
        image: "🎸",
        personalityTags: ["E", "S", "F", "P"],
        vibes: ["energetic", "social"],
        tags: ["Music", "Live Music", "Rock"],
        ...
    }
];
```

## 🔍 Monitoring & Troubleshooting

### View GitHub Actions Logs

1. Go to repository on GitHub
2. Click "Actions" tab
3. Select "Scrape Central Florida Events" workflow
4. View recent runs and logs

### Manual Trigger

1. Go to "Actions" tab
2. Select "Scrape Central Florida Events"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Check Scraping Statistics

```bash
# View raw scraped data stats
python -c "
import json
data = json.load(open('central_florida_events.json'))
print(f'Total Events: {data[\"total_events\"]}')
for event in data['events'][:5]:
    print(f'- {event[\"name\"]} at {event[\"venue\"]}')"

# View integrated data stats
python -c "
import json
data = json.load(open('integrated_events.json'))
print(f'Total Integrated: {data[\"total_events\"]}')
print(f'Generated: {data[\"generated_at\"]}')"
```

### Common Issues

#### Issue: No events scraped
**Solution:** Check if venue websites are accessible, or if their structure changed

#### Issue: Integration fails
**Solution:** Check if scraped JSON has valid format and required fields

#### Issue: GitHub Actions fails
**Solution:** Check workflow logs for specific error messages

## 🌐 Adding New Sources

### Step 1: Verify Source Accessibility

Check `EVENT_SOURCES.md` for source evaluation. Add new sources to the document:

```markdown
### New Venue Name
- **URL:** https://example.com/events
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Category of events
```

### Step 2: Create Scraper Class

Add to `multi_source_scraper.py`:

```python
class NewVenueScraper(EventScraper):
    """Scraper for New Venue."""

    URL = 'https://example.com/events'
    NAME = 'New Venue Name'
    LOCATION = 'Address'

    def scrape(self) -> List[Event]:
        """Scrape events from the venue."""
        soup = self.fetch_page(self.URL)
        if not soup:
            return []

        events = self._extract_from_json_ld(soup)
        if not events:
            events = self._extract_from_html(soup)

        return events

    def _extract_from_json_ld(self, soup: BeautifulSoup) -> List[Event]:
        """Extract from JSON-LD structured data."""
        # Implementation here
        pass

    def _extract_from_html(self, soup: BeautifulSoup) -> List[Event]:
        """Extract from HTML structure."""
        # Implementation here
        pass
```

### Step 3: Register Scraper

Add to `MultiSourceScraper.__init__`:

```python
self.scrapers = [
    WillsPubScraper(delay=delay),
    PlazaLiveScraper(delay=delay),
    NewVenueScraper(delay=delay),  # Add new scraper
]
```

### Step 4: Test

```bash
# Test the scraper
python multi_source_scraper.py

# Check output
cat central_florida_events.json
```

## 📈 Statistics & Analytics

### View Scraping Statistics

After running the scraper:

```bash
# The scraper automatically prints stats:
# ============================================================
# SCRAPING STATISTICS
# ============================================================
# Total Events: 42
#
# Events by Venue:
#   Will's Pub: 15
#   Lil Indies: 12
#   Dirty Laundry: 8
#   The Plaza Live: 7
#
# Events by Price Category:
#   free: 5
#   budget: 18
#   moderate: 14
#   premium: 5
```

### Integration Statistics

```bash
# The integrator automatically prints stats:
# ============================================================
# INTEGRATION STATISTICS
# ============================================================
# Total Integrated Events: 42
#
# Events by Category:
#   music: 42
#
# Events by Price Category:
#   free: 5
#   budget: 18
#   moderate: 14
#   premium: 5
```

## 🔐 Ethical Scraping Practices

This system follows web scraping best practices:

### ✅ We Do:
- Respect robots.txt directives
- Implement rate limiting (1.5s+ delays)
- Use descriptive User-Agent header
- Cache results (24-hour minimum)
- Attribute all data to sources
- Only scrape public information
- Focus on scraper-friendly sources

### ❌ We Don't:
- Scrape sites that explicitly prohibit it
- Make rapid-fire requests
- Ignore rate limits
- Scrape user-generated content without permission
- Access authenticated content
- Bypass anti-scraping measures
- Scrape sites with official APIs (we use APIs instead)

### User-Agent

Our scraper identifies itself:
```
CentralFloridaEventsBot/1.0 (+https://github.com/technical-communicator/Central-Florida-Events)
```

## 📝 Maintenance

### Regular Tasks

- **Weekly**: Review EVENT_SOURCES.md for new sources
- **Monthly**: Check for broken scrapers (website structure changes)
- **Quarterly**: Evaluate new API options for existing sources

### Updating Source List

When you find a new event source:

1. Test if it's scraper-friendly
2. Add to EVENT_SOURCES.md with proper categorization
3. Implement scraper if High/Medium accessibility
4. Test thoroughly before adding to automation

## 🤝 Contributing

### Adding New Sources

1. Research the source and check robots.txt
2. Add source to EVENT_SOURCES.md
3. Implement scraper class
4. Test manually
5. Submit pull request with documentation

### Reporting Issues

If a scraper breaks or a source changes:

1. Check GitHub Issues for existing reports
2. Create new issue with:
   - Source name
   - Error description
   - Expected vs actual behavior
   - Example URL

## 📚 Additional Resources

- **Main README**: Project overview and setup
- **SCRAPER_README.md**: Original Will's Pub scraper documentation
- **EVENT_SOURCES.md**: Comprehensive source database
- **GitHub Actions Docs**: https://docs.github.com/en/actions

## 🔄 Continuous Improvement

The system is designed for continuous expansion:

### Current Status (v1.0)
- ✅ 2 venue groups (Will's Pub family, Plaza Live)
- ✅ Daily automation
- ✅ Data integration pipeline
- ✅ 24+ sources documented

### Planned Additions (v1.1)
- ⏳ Beacham & Social venues
- ⏳ Enzian Theater
- ⏳ Mad Cow Theatre
- ⏳ Orange County calendars
- ⏳ Email notifications on scraping failures

### Future Enhancements (v2.0)
- ⏳ Machine learning for personality tag prediction
- ⏳ Event deduplication across sources
- ⏳ Automatic image generation/selection
- ⏳ Natural language processing for better descriptions

---

## 📞 Support

**Questions or Issues?**
- 📧 Open a GitHub Issue
- 📖 Check EVENT_SOURCES.md
- 💬 Review GitHub Actions logs

**Project Repository:**
https://github.com/technical-communicator/Central-Florida-Events

---

**Last Updated:** 2025-11-11
**Version:** 1.0
**Maintained By:** Central Florida Events Team
