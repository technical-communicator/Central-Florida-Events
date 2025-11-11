# Will's Pub Event Scraper

A Python web scraper for extracting event data from Will's Pub venues in Orlando, Florida.

## Target Venues

The scraper extracts event information from three venues:

1. **Will's Pub** - https://willspub.org/tm-venue/wills-pub/
2. **Lil Indies** - https://willspub.org/tm-venue/lil-indies/
3. **Dirty Laundry** - https://willspub.org/tm-venue/dirty-laundry/

## Extracted Data

The scraper extracts the following information for each event:

- **Event name/title** - The name of the event
- **Event date and time** - When the event takes place
- **Venue name** - Which venue (Will's Pub, Lil Indies, or Dirty Laundry)
- **Artist/performer names** - The performing artists
- **Ticket price** - Pricing information
- **Event URL** - Link to the event details page
- **Genre/tags** - Event type and genre classifications
- **Description** - Event description if available

## Installation

1. Install Python 3.7 or higher

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install requests beautifulsoup4 lxml
```

## Usage

### Basic Usage

Run the scraper:
```bash
python wills_pub_scraper.py
```

This will:
- Scrape all three venues
- Print a summary of found events
- Save data to `wills_pub_events.json` and `wills_pub_events.csv`

### Using as a Module

You can also import and use the scraper in your own Python code:

```python
from wills_pub_scraper import WillsPubScraper

# Create scraper instance
scraper = WillsPubScraper(delay=1.0)

# Scrape all venues
events = scraper.scrape_all_venues()

# Scrape a specific venue
wills_pub_events = scraper.scrape_venue('wills-pub')
lil_indies_events = scraper.scrape_venue('lil-indies')
dirty_laundry_events = scraper.scrape_venue('dirty-laundry')

# Save to JSON
scraper.save_to_json('my_events.json')

# Save to CSV
scraper.save_to_csv('my_events.csv')

# Print summary
scraper.print_summary()
```

## Output Format

### JSON Format

The scraper saves events in JSON format with the following structure:

```json
[
  {
    "venue": "Will's Pub",
    "event_name": "Example Band Live",
    "date": "2025-11-15",
    "time": "20:00:00",
    "date_display": "Friday, November 15, 2025 at 8:00 PM",
    "artists": "Example Band, Opening Act",
    "price": "$15",
    "event_url": "https://willspub.org/event/example-band-live/",
    "tags": ["Rock", "Local"],
    "description": "Join us for an amazing night of live music..."
  }
]
```

### CSV Format

The same data is also exported to CSV format for easy import into spreadsheet applications.

## Features

- **Robust HTML parsing** - Uses multiple strategies to find event data
- **JSON-LD support** - Extracts structured data when available
- **Error handling** - Continues scraping even if individual events fail
- **Polite scraping** - Includes delays between requests
- **Multiple export formats** - Saves to both JSON and CSV
- **Logging** - Detailed logs for debugging
- **Flexible extraction** - Works with various HTML structures

## Configuration

You can configure the scraper by modifying these parameters:

```python
scraper = WillsPubScraper(
    delay=1.0  # Delay between venue requests in seconds
)
```

## Troubleshooting

### 403 Forbidden Errors

The Will's Pub website may block automated scraping attempts with 403 Forbidden errors. This is a common anti-bot protection measure. If you encounter this:

**Possible Solutions:**

1. **Browser Testing** - First, try accessing the URLs in your browser to ensure they're publicly accessible
2. **Rate Limiting** - The scraper includes delays between requests, but you can increase them:
   ```python
   scraper = WillsPubScraper(delay=2.0)  # Increase delay to 2 seconds
   ```
3. **Alternative Approaches:**
   - Check if Will's Pub provides an official API or RSS feed
   - Contact the venue to ask about data access
   - Use the scraper during off-peak hours
   - Run from different IP addresses or networks
4. **Manual Data Collection** - If automated scraping is blocked, you may need to manually collect event data

**Important Note:** Respect the website's anti-scraping measures. If they're blocking automated access, consider reaching out to the venue management to discuss legitimate data access options.

### No events found

If the scraper runs but doesn't find any events:

1. Check your internet connection
2. Verify the websites are accessible in a browser
3. The website structure may have changed - check the logs for details
4. Try running with verbose logging to see what's being extracted

### Missing data fields

Some events may not have all fields available. The scraper will extract whatever data is present on the page.

### Example Output

See `wills_pub_events_example.json` for an example of the expected output format when the scraper successfully extracts event data.

## Legal and Ethical Considerations

- This scraper is for educational and personal use
- Be respectful of the website's resources (the scraper includes delays)
- Check the website's `robots.txt` and terms of service
- Consider using official APIs if available
- Don't scrape too frequently or aggressively

## Dependencies

- `requests` - HTTP library for fetching web pages
- `beautifulsoup4` - HTML parsing library
- `lxml` - Fast XML and HTML parser

## License

This scraper is provided as-is for the Central Florida Events project.

## Contributing

If you find issues with the scraper or want to improve it:

1. Check if the website structure has changed
2. Update the CSS selectors or extraction logic
3. Test thoroughly with all three venues
4. Submit your improvements

## Support

For issues or questions, please open an issue in the project repository.
