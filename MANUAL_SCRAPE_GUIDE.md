# Manual Event Scraping Guide

This guide explains how to use the Manual Scrape feature in the Admin Panel to add events from external venue websites.

## Overview

The Manual Scrape feature allows administrators to:
1. Fetch HTML from venue event pages
2. Extract event information automatically using intelligent parsing
3. Review and edit extracted events before approval
4. Approve events individually or in bulk

## Step-by-Step Instructions

### Method 1: Using the Python Helper Script (Recommended)

1. **Run the helper script** to fetch HTML from a venue:
   ```bash
   python manual_scrape_helper.py https://example-venue.com/events/
   ```

2. **The script will save** the HTML to `scraped_html.txt`

3. **Log into the admin panel** using the password (default: "admin123")

4. **Navigate to the "Manual Scrape" tab**

5. **Fill in the form:**
   - **Venue URL**: The URL you scraped (e.g., https://example-venue.com/events/)
   - **Venue Name**: Name of the venue (e.g., "Example Venue")
   - **Default Category**: Select the primary category for events at this venue

6. **Copy the HTML** from `scraped_html.txt` and paste into the "HTML Source" field

7. **Click "Parse Events"** to extract events

8. **Review the extracted events:**
   - Each event is displayed in a card with editable fields
   - Edit any fields that need correction (date, time, price, description, etc.)
   - Category changes will automatically update the event emoji and vibes

9. **Approve events:**
   - Click "✅ Approve" on individual events to add them one at a time
   - Click "✅ Approve All" to add all events to pending status
   - Click "❌ Remove" to remove events you don't want

10. **Events are added to "Pending Events"** where you can review and approve them for public display

### Method 2: Manual HTML Copy-Paste

If you can't run the Python script:

1. **Open the venue's events page** in your browser

2. **View the page source:**
   - Chrome/Edge: Press `Ctrl+U` (Windows) or `Cmd+Option+U` (Mac)
   - Firefox: Press `Ctrl+U` (Windows) or `Cmd+U` (Mac)
   - Safari: Enable Developer menu, then press `Cmd+Option+U`

3. **Copy all the HTML source code**

4. **Log into the admin panel**

5. **Navigate to "Manual Scrape" tab**

6. **Fill in the form** and paste the HTML into the "HTML Source" field

7. **Follow steps 7-10 from Method 1**

## How Event Extraction Works

The scraper uses two methods to extract events:

### 1. JSON-LD Structured Data (Most Reliable)
Many modern websites include event data in JSON-LD format (Schema.org Event type). The scraper automatically detects and extracts:
- Event name
- Date and time
- Location/address
- Price
- Description
- External links

### 2. HTML Pattern Matching (Fallback)
If JSON-LD isn't found, the scraper looks for common HTML patterns:
- Event containers (`.event`, `.event-item`, etc.)
- Event titles in headings (h1-h4)
- Dates in `<time>` tags or date-related classes
- Prices in price-related elements
- Links to event pages

## Supported Fields

After extraction, you can edit these fields for each event:

| Field | Description | Example |
|-------|-------------|---------|
| **Venue** | Name of the venue | "Will's Pub" |
| **Date** | Event date | 2025-01-15 |
| **Time** | Event time | 8:00 PM |
| **Price** | Ticket price in dollars | 15.00 |
| **Category** | Event category | Music, Food, Arts, etc. |
| **Description** | Event description | Full event details |
| **External Link** | Link to event page | https://venue.com/event |

## Tips for Best Results

1. **Use the most specific events page** - Scrape from dedicated event calendars or listings pages

2. **Check the HTML preview** - Make sure the HTML contains event data before parsing

3. **Review before approving** - Always check dates, times, and prices for accuracy

4. **Edit as needed** - Don't hesitate to correct any extracted information

5. **Test with one event first** - If you're unsure, try scraping a single event page before bulk scraping

## Troubleshooting

### "No events found in the provided HTML"

**Possible causes:**
- The page doesn't have structured event data
- Events are loaded dynamically via JavaScript (not in initial HTML)
- The HTML doesn't match common event patterns

**Solutions:**
- Try scraping a different page from the same venue
- Look for an "events" or "calendar" page specifically
- Contact support if a venue should be supported

### Events have incorrect dates/times

**Possible causes:**
- Date format not recognized
- Timezone issues
- Dates in relative format ("Tomorrow", "Next Friday")

**Solutions:**
- Manually edit the date field before approving
- Use the date picker for accurate dates

### Missing event descriptions

**Possible causes:**
- Descriptions are truncated in the listing
- Full details only on individual event pages

**Solutions:**
- Scrape individual event pages instead of listing pages
- Manually add or edit descriptions before approving

## Advanced Usage

### Scraping Multiple Venues

You can scrape multiple venues in one session:
1. Scrape the first venue and approve events
2. Click "Clear Form" to reset
3. Scrape the next venue
4. Repeat as needed

### Bulk Event Management

After parsing events:
- Use "✅ Approve All" to quickly add all events
- Events go to "Pending Events" first for final review
- You can still reject events from the "Pending Events" tab

### Regular Scraping Schedule

For venues you scrape regularly:
1. Save the venue URL and settings
2. Run the Python script weekly or monthly
3. Paste and parse the new HTML
4. Review for duplicate events
5. Approve new events only

## Security Notes

- The Manual Scrape feature is **admin-only**
- Always verify event details before approving
- Be respectful of venue websites (don't scrape too frequently)
- The Python script includes a proper User-Agent header

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify the HTML contains event data
3. Try a different page from the venue
4. Report issues via GitHub: https://github.com/technical-communicator/Central-Florida-Events/issues

## Example Workflows

### Example 1: Scraping Will's Pub

```bash
# 1. Fetch HTML
python manual_scrape_helper.py https://willspub.org/events/

# 2. In admin panel:
#    - Venue URL: https://willspub.org/events/
#    - Venue Name: Will's Pub
#    - Category: Music
#    - Paste HTML from scraped_html.txt

# 3. Click "Parse Events"
# 4. Review and edit events
# 5. Click "Approve All"
```

### Example 2: Scraping The Plaza Live

```bash
# 1. Fetch HTML
python manual_scrape_helper.py https://plazaliveorlando.com/events/

# 2. In admin panel:
#    - Venue URL: https://plazaliveorlando.com/events/
#    - Venue Name: The Plaza Live
#    - Category: Music
#    - Paste HTML

# 3. Parse and approve
```

## Related Documentation

- [Admin Panel Guide](./ADMIN_GUIDE.md) (if exists)
- [Event Data Structure](./events-data.js)
- [Main README](./README.md)

---

**Last Updated:** 2025-11-11
**Version:** 1.0
