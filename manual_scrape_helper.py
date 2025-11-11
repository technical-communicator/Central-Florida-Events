#!/usr/bin/env python3
"""
Manual Scrape Helper Script

This script helps admins fetch HTML from a venue's event page
for use with the manual scraping feature in the admin panel.

Usage:
    python manual_scrape_helper.py <URL>

Example:
    python manual_scrape_helper.py https://willspub.org/events/

The script will:
1. Fetch the HTML from the provided URL
2. Save it to a file named 'scraped_html.txt'
3. Print the HTML to console for easy copy-paste
"""

import requests
import sys
import argparse
from datetime import datetime


def fetch_html(url: str, output_file: str = 'scraped_html.txt') -> str:
    """
    Fetch HTML from a URL and save it to a file.

    Args:
        url: The URL to fetch
        output_file: File to save the HTML to

    Returns:
        The HTML content as a string
    """
    try:
        print(f"Fetching HTML from: {url}")
        print("-" * 60)

        # Set up headers to mimic a browser
        headers = {
            'User-Agent': 'CentralFloridaEventsBot/1.0 (+https://github.com/technical-communicator/Central-Florida-Events)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

        # Fetch the page
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html_content = response.text

        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"<!-- Scraped from: {url} -->\n")
            f.write(f"<!-- Scraped at: {datetime.now().isoformat()} -->\n")
            f.write(html_content)

        print(f"✓ Successfully fetched HTML ({len(html_content)} characters)")
        print(f"✓ Saved to: {output_file}")
        print("-" * 60)
        print("\nInstructions:")
        print("1. Open the admin panel in your browser")
        print("2. Go to the 'Manual Scrape' tab")
        print("3. Enter the venue details")
        print("4. Copy the contents of 'scraped_html.txt' and paste into the 'HTML Source' field")
        print("5. Click 'Parse Events' to extract events")
        print("-" * 60)
        print("\nHTML Preview (first 500 characters):")
        print(html_content[:500])
        print("...")
        print("-" * 60)

        return html_content

    except requests.RequestException as e:
        print(f"✗ Error fetching URL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Fetch HTML from a venue event page for manual scraping',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manual_scrape_helper.py https://willspub.org/events/
  python manual_scrape_helper.py https://plazaliveorlando.com/events/ -o plaza_events.txt

After running this script:
1. Log into the admin panel
2. Navigate to the "Manual Scrape" tab
3. Fill in the venue information
4. Copy the contents of the output file and paste into the "HTML Source" field
5. Click "Parse Events" to extract events
6. Review and edit the extracted events
7. Approve individual events or approve all at once
        """
    )

    parser.add_argument(
        'url',
        help='URL of the venue event page to scrape'
    )

    parser.add_argument(
        '-o', '--output',
        default='scraped_html.txt',
        help='Output file to save HTML (default: scraped_html.txt)'
    )

    args = parser.parse_args()

    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        print("✗ Error: URL must start with http:// or https://")
        sys.exit(1)

    # Fetch the HTML
    fetch_html(args.url, args.output)


if __name__ == '__main__':
    main()
