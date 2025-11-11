# Central Florida Event Sources - Web Scraping Accessibility Guide

**Last Updated:** 2025-11-11

This document provides a comprehensive list of Central Florida event sources categorized by their web scraping accessibility. Sources are evaluated based on their robots.txt policies, anti-scraping measures, and data accessibility.

---

## 🟢 HIGH ACCESSIBILITY - Scraper-Friendly Sources

These sources have minimal anti-scraping measures, provide structured data, or are public resources that welcome automated access.

### 1. **Will's Pub Venues** ✅ ACTIVE
- **URLs:**
  - Will's Pub: https://willspub.org/tm-venue/wills-pub/
  - Lil Indies: https://willspub.org/tm-venue/lil-indies/
  - Dirty Laundry: https://willspub.org/tm-venue/dirty-laundry/
- **Scraping Status:** ✅ Currently working with existing Python scraper
- **Data Format:** HTML with JSON-LD structured data
- **Event Types:** Live music, concerts, local bands
- **Update Frequency:** Multiple events per week
- **Notes:** Well-structured HTML, includes schema.org Event markup

### 2. **Orange County Parks & Recreation**
- **URL:** https://www.ocparks.com/events
- **Scraping Status:** 🟡 Accessible (public government resource)
- **Data Format:** HTML calendar view
- **Event Types:** Community events, outdoor activities, festivals
- **Update Frequency:** Weekly
- **Notes:** Public government site, typically allows reasonable scraping with rate limiting

### 3. **Orange County Arts & Culture Calendar**
- **URL:** https://www.orangecountyfl.net/CultureParks/ArtsandCultureCalendar.aspx
- **Scraping Status:** 🟡 Accessible (public government resource)
- **Data Format:** ASP.NET application with event listings
- **Event Types:** Arts, theater, cultural events, exhibitions
- **Update Frequency:** Weekly
- **Notes:** Government-funded arts organizations, public access encouraged

### 4. **Avalon Park Orlando Event Calendar**
- **URL:** https://avalonparkorlando.com/play/event-calendar/
- **Scraping Status:** 🟢 Likely accessible
- **Data Format:** WordPress or CMS-based calendar
- **Event Types:** Community events, farmers markets, outdoor activities
- **Update Frequency:** Weekly
- **Notes:** Community-focused site, public event promotion

### 5. **Winter Park Magazine Events**
- **URL:** https://winterparkmag.com/eventcalendar/
- **Scraping Status:** 🟢 Likely accessible
- **Data Format:** HTML event listings
- **Event Types:** Local Winter Park events, arts, dining
- **Update Frequency:** Weekly
- **Notes:** Local publication promoting community events

### 6. **Winter Springs Community Events**
- **URL:** https://www.winterspringsfl.org/community/page/community-events
- **Scraping Status:** 🟡 Accessible (municipal government site)
- **Data Format:** HTML listings
- **Event Types:** City-sponsored events, community activities
- **Update Frequency:** Monthly
- **Notes:** Municipal website, public information

### 7. **Seminole County Family Events (Fun4SeminoleKids)**
- **URL:** https://fun4seminolekids.com/calendar
- **Scraping Status:** 🟢 Likely accessible
- **Data Format:** Calendar plugin or CMS
- **Event Types:** Family-friendly events, kid activities
- **Update Frequency:** Weekly
- **Notes:** Community resource site, encourages public access

### 8. **MyCentralFloridaFamily.com**
- **URL:** https://mycentralfloridafamily.com/orlando-events-calendar/
- **Scraping Status:** 🟢 Likely accessible
- **Data Format:** WordPress with event plugin
- **Event Types:** Family events across Orange, Seminole, Osceola, Lake, Volusia counties
- **Update Frequency:** Daily
- **Notes:** Aggregates events from multiple counties, family-focused

---

## 🟡 MEDIUM ACCESSIBILITY - Structured Data Available

These sources may have some protection but provide structured data formats (JSON-LD, RSS, iCal) that make them accessible with proper techniques.

### 9. **Dr. Phillips Center for the Performing Arts**
- **URL:** https://www.drphillipscenter.org/events/
- **Scraping Status:** 🟡 Moderate (ticketing platform)
- **Data Format:** Likely uses ticketing API (Tessitura or similar)
- **Event Types:** Broadway shows, concerts, opera, ballet, theater
- **Update Frequency:** Monthly (season-based)
- **Notes:** Major venue, may have structured data or calendar exports
- **Recommendation:** Check for iCal export or RSS feed

### 10. **Orlando Weekly Events**
- **URL:** https://www.orlandoweekly.com/orlando/EventSearch
- **Scraping Status:** 🟡 Moderate (publication website)
- **Data Format:** HTML with event search functionality
- **Event Types:** Concerts, nightlife, arts, food & drink
- **Update Frequency:** Daily
- **Notes:** Alternative weekly publication, community calendar
- **Recommendation:** Use proper user agent and rate limiting

### 11. **ClickOrlando Community Calendar**
- **URL:** https://www.clickorlando.com/community-calendar/
- **Scraping Status:** 🟡 Moderate (news site)
- **Data Format:** HTML calendar view
- **Event Types:** Community events, festivals, local happenings
- **Update Frequency:** Daily
- **Notes:** TV station website, user-submitted events
- **Recommendation:** Check for RSS feeds

### 12. **The Orlando Guy Events Calendar**
- **URL:** https://www.theorlandoguy.com/orlando-events-calendar/
- **Scraping Status:** 🟢 Likely accessible
- **Data Format:** Blog/CMS-based calendar
- **Event Types:** Major Orlando events, festivals, theme parks
- **Update Frequency:** Weekly
- **Notes:** Independent blog, curated event listings

---

## 🔴 LOW ACCESSIBILITY - Anti-Scraping Measures

These sources have aggressive anti-scraping measures, require authentication, or explicitly prohibit automated access.

### 13. **Eventbrite**
- **URL:** https://www.eventbrite.com/d/fl--orlando/events/
- **Scraping Status:** 🔴 Difficult (anti-scraping)
- **Data Format:** JavaScript-rendered SPA (Single Page Application)
- **Event Types:** All types (ticketed events)
- **Update Frequency:** Real-time
- **Notes:** Has official API available (requires authentication)
- **Recommendation:** ⚠️ Use official Eventbrite API instead of scraping

### 14. **Facebook Events**
- **URL:** https://www.facebook.com/events/
- **Scraping Status:** 🔴 Blocked (anti-scraping + authentication)
- **Data Format:** JavaScript-rendered, requires login
- **Event Types:** Community events, concerts, social gatherings
- **Update Frequency:** Real-time
- **Notes:** Facebook actively blocks scrapers
- **Recommendation:** ⚠️ Use Facebook Graph API (requires app approval)

### 15. **Meetup.com**
- **URL:** https://www.meetup.com/find/us--fl--altamonte-springs/
- **Scraping Status:** 🔴 Difficult (anti-scraping)
- **Data Format:** JavaScript-rendered
- **Event Types:** Community meetups, networking events
- **Update Frequency:** Real-time
- **Notes:** Has official API available (paid)
- **Recommendation:** ⚠️ Use official Meetup API

### 16. **Ticketmaster/Live Nation**
- **URL:** Various venue pages
- **Scraping Status:** 🔴 Blocked (anti-scraping)
- **Data Format:** Heavily protected ticketing platform
- **Event Types:** Major concerts, sports, theater
- **Update Frequency:** Real-time
- **Notes:** Aggressive anti-bot measures
- **Recommendation:** ⚠️ Use official Ticketmaster Discovery API

---

## 📊 Venue-Specific Sources (Independent Venues)

These are individual venue websites that typically have event calendars. Most independent venues are scraper-friendly as they want to promote their events.

### 17. **The Plaza Live**
- **URL:** https://plazaliveorlando.com/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Concerts, live music
- **Capacity:** 1,100-person venue

### 18. **The Beacham & The Social**
- **URL:** https://thebeacham.com/ & https://thesocialfl.com/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Concerts, DJs, electronic music
- **Notes:** Connected venues in downtown Orlando

### 19. **Enzian Theater**
- **URL:** https://enzian.org/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Independent films, film festivals
- **Location:** Maitland

### 20. **Mad Cow Theatre**
- **URL:** https://www.madcowtheatre.com/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Theater productions, plays
- **Update Frequency:** Seasonal

### 21. **Orlando Shakes (Orlando Shakespeare Theater)**
- **URL:** https://www.orlandoshakes.org/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Shakespeare, theater, education programs
- **Location:** Lake Eola

### 22. **SAK Comedy Lab**
- **URL:** https://sakcomedylab.com/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Improv comedy, comedy shows
- **Location:** Downtown Orlando

### 23. **The Abbey**
- **URL:** https://abbeyorlando.com/
- **Scraping Status:** 🟢 Likely accessible
- **Event Types:** Live music, local bands, themed events

### 24. **Stardust Video & Coffee**
- **URL:** https://www.facebook.com/stardustvideocoffee (primarily Facebook)
- **Scraping Status:** 🔴 Facebook-dependent
- **Event Types:** Indie music, video rentals, coffee shop events
- **Notes:** May need to check their website if they have one

---

## 🎯 Recommended Scraping Priority

Based on accessibility, data quality, and event diversity:

### Tier 1 - Implement First (Highest Value, Low Friction)
1. ✅ Will's Pub Venues (DONE)
2. Orange County Parks & Recreation
3. Orange County Arts & Culture Calendar
4. MyCentralFloridaFamily.com
5. The Plaza Live
6. The Beacham & The Social

### Tier 2 - Implement Next (Good Value, Moderate Effort)
7. Avalon Park Orlando
8. Winter Park Magazine Events
9. Seminole County Family Events
10. Enzian Theater
11. Mad Cow Theatre
12. Orlando Shakes

### Tier 3 - Use APIs (Don't Scrape)
- Eventbrite (use Eventbrite API)
- Facebook Events (use Graph API if possible)
- Meetup.com (use Meetup API)
- Ticketmaster venues (use Discovery API)

### Tier 4 - Monitor for Changes
- Dr. Phillips Center (check for calendar exports)
- Orlando Weekly (check for RSS)
- ClickOrlando (check for RSS)

---

## 🤖 Scraping Best Practices

To maintain access to these sources and be a good web citizen:

### 1. Rate Limiting
- **Minimum delay:** 1-2 seconds between requests to the same domain
- **Government sites:** 2-3 seconds (they often have slower servers)
- **Commercial sites:** 1-2 seconds
- **Independent venues:** 1 second

### 2. User Agent
```python
USER_AGENT = 'CentralFloridaEventsBot/1.0 (+https://github.com/technical-communicator/Central-Florida-Events; contact@example.com)'
```

### 3. Respect robots.txt
- Always check and respect robots.txt directives
- If uncertain, use conservative approach

### 4. Caching
- Cache results for at least 6-24 hours
- Don't re-scrape the same page multiple times per day

### 5. Error Handling
- Implement exponential backoff on errors
- Log failures but don't retry immediately
- Alert on persistent failures

### 6. Data Attribution
- Always include source URL in scraped data
- Credit the venue/organizer
- Include "lastUpdated" timestamp

---

## 📅 Update Schedule Recommendations

### Daily Scraping (High-Volume Sources)
- MyCentralFloridaFamily.com
- Will's Pub Venues

### 2-3 Times per Week
- Orlando Weekly Events
- Individual music venues (Plaza Live, Beacham, etc.)

### Weekly
- Orange County calendars
- City/municipal calendars
- Magazine event listings

### Monthly
- Theater venues (season-based)
- Arts organizations (Dr. Phillips, Mad Cow, etc.)

---

## 🔧 Technical Implementation Notes

### Structured Data Support
Many sites use Schema.org Event markup. Look for:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Event Name",
  "startDate": "2025-11-15T20:00",
  "location": {...},
  "offers": {...}
}
</script>
```

### iCalendar (ICS) Support
Some venues offer .ics calendar exports:
- Check for "Add to Calendar" links
- Look for /calendar.ics or /events.ics endpoints

### RSS/Atom Feeds
Look for:
- `<link rel="alternate" type="application/rss+xml">`
- /feed, /rss, /events/feed URLs

---

## 📝 Data Integration Format

All scraped events should be converted to this standardized format:

```javascript
{
  "name": "Event Name",
  "category": "music|arts|food|sports|outdoor|education|community|family",
  "description": "Event description...",
  "location": "Venue Name, Address",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "price": 0-999,
  "priceCategory": "free|budget|moderate|premium",
  "externalLink": "https://...",
  "source": "Source Name",
  "sourceUrl": "https://...",
  "scrapedAt": "2025-11-11T10:00:00Z",
  "tags": ["tag1", "tag2"],
  "image": "🎵", // emoji or URL
  "venue": "indoor|outdoor",
  "capacity": "small|medium|large"
}
```

---

## 🚀 Next Steps

1. ✅ Create comprehensive source list (this document)
2. ⏳ Build multi-source scraper supporting Tier 1 sources
3. ⏳ Implement GitHub Actions for daily automated scraping
4. ⏳ Create data integration pipeline
5. ⏳ Add source status dashboard
6. ⏳ Monitor and adjust based on success rates

---

## 📞 Contact & Legal

**Project:** Search Central Florida
**Repository:** https://github.com/technical-communicator/Central-Florida-Events
**Purpose:** Community service - aggregating public event information
**Contact:** [Add contact email]

**Legal Notice:**
This scraper respects robots.txt, implements rate limiting, and only accesses publicly available information. All data is attributed to original sources. If you are a venue or event organizer and would like your events included or excluded, please contact us.

---

**Legend:**
- 🟢 Green = Scraper-friendly, minimal restrictions
- 🟡 Yellow = Accessible with proper techniques and rate limiting
- 🔴 Red = Anti-scraping measures, use API instead
- ✅ = Currently implemented and working
- ⏳ = Planned for implementation
- ⚠️ = Caution required
