// Central Florida Events App - Main Application Logic

// State Management
const AppState = {
    userSubmittedEvents: [],
    savedEvents: new Set(),
    reviews: [],
    currentScreen: 'explore',
    currentEventId: null,
    events: EVENTS_DATA,
    isAdmin: false,
    adminPassword: 'admin123', // Default admin password
    currentAdminTab: 'pending'
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    initializeApp();
    initBackToTop();
});

// Load state from localStorage
function loadStateFromLocalStorage() {
    const userSubmittedEvents = localStorage.getItem('userSubmittedEvents');
    const savedEvents = localStorage.getItem('savedEvents');
    const savedReviews = localStorage.getItem('reviews');
    const adminPassword = localStorage.getItem('adminPassword');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (userSubmittedEvents) {
        AppState.userSubmittedEvents = JSON.parse(userSubmittedEvents);
        // Only merge approved user-submitted events with existing events for public view
        const approvedEvents = AppState.userSubmittedEvents.filter(e => e.status === 'approved');
        AppState.events = [...EVENTS_DATA, ...approvedEvents];
    }
    if (savedEvents) {
        AppState.savedEvents = new Set(JSON.parse(savedEvents));
    }
    if (savedReviews) {
        AppState.reviews = JSON.parse(savedReviews);
    }
    if (adminPassword) {
        AppState.adminPassword = adminPassword;
    }
    AppState.isAdmin = isAdmin;
}

// Save state to localStorage
function saveStateToLocalStorage() {
    localStorage.setItem('userSubmittedEvents', JSON.stringify(AppState.userSubmittedEvents));
    localStorage.setItem('savedEvents', JSON.stringify([...AppState.savedEvents]));
    localStorage.setItem('reviews', JSON.stringify(AppState.reviews));
    localStorage.setItem('adminPassword', AppState.adminPassword);
    localStorage.setItem('isAdmin', AppState.isAdmin.toString());
}

// Initialize the application
function initializeApp() {
    setupEventListeners();

    // Always show explore screen by default (hero page)
    showScreen('explore');
    displayEvents();
}

// Setup all event listeners
function setupEventListeners() {
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenu');

    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        sideMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = sideMenu.classList.contains('active') ? 'hidden' : '';
    });

    closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event registration form
    document.getElementById('addEventBtn').addEventListener('click', () => {
        showScreen('onboarding');
        closeMenu();
    });

    const eventForm = document.getElementById('eventRegistrationForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmission);
    }

    // Menu navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
            closeMenu();
        });
    });

    // Search and filter
    document.getElementById('searchInput').addEventListener('input', filterAndDisplayEvents);
    document.getElementById('filterCategory').addEventListener('change', filterAndDisplayEvents);
    document.getElementById('sortBy').addEventListener('change', filterAndDisplayEvents);

    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('eventModal').classList.remove('active');
    });
    document.getElementById('closeReviewModal').addEventListener('click', () => {
        document.getElementById('reviewModal').classList.remove('active');
    });

    // Star rating
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', handleStarRating);
        star.addEventListener('mouseenter', handleStarHover);
    });
    document.getElementById('starRating').addEventListener('mouseleave', resetStarHover);

    // Submit review
    document.getElementById('submitReview').addEventListener('click', handleReviewSubmit);

    // Hero Add Event CTA button
    const heroAddEventCta = document.getElementById('heroAddEventCta');
    if (heroAddEventCta) {
        heroAddEventCta.addEventListener('click', () => {
            showScreen('onboarding');
        });
    }

    // Admin button
    document.getElementById('adminBtn').addEventListener('click', () => {
        if (AppState.isAdmin) {
            showScreen('admin');
            displayAdminEvents();
            closeMenu();
        } else {
            promptAdminLogin();
        }
    });

    // Admin logout
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        AppState.isAdmin = false;
        saveStateToLocalStorage();
        alert('Logged out successfully');
        showScreen('explore');
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentAdminTab = btn.dataset.adminTab;
            displayAdminEvents();
        });
    });
}

// Event Registration Functions
function handleEventSubmission(e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(e.target);

    // Get selected vibes
    const vibes = Array.from(document.querySelectorAll('input[name="eventVibes"]:checked'))
        .map(input => input.value);

    // Validate at least one vibe is selected
    if (vibes.length === 0) {
        alert('Please select at least one event vibe');
        return;
    }

    // Determine price category
    const price = parseFloat(formData.get('eventPrice'));
    let priceCategory;
    if (price === 0) {
        priceCategory = 'free';
    } else if (price <= 20) {
        priceCategory = 'budget';
    } else if (price <= 50) {
        priceCategory = 'moderate';
    } else {
        priceCategory = 'premium';
    }

    // Generate a unique ID for the event
    const newEventId = Date.now();

    // Get category icon
    const categoryIcons = {
        'music': '🎵',
        'food': '🍽️',
        'sports': '⚽',
        'arts': '🎨',
        'outdoor': '🌳',
        'education': '📚',
        'community': '👥'
    };

    // Create new event object
    const newEvent = {
        id: newEventId,
        name: formData.get('eventName'),
        category: formData.get('eventCategory'),
        description: formData.get('eventDescription'),
        location: formData.get('eventLocation'),
        venue: formData.get('eventVenue') || formData.get('eventLocation'),
        date: formData.get('eventDate'),
        time: formData.get('eventTime'),
        duration: formData.get('eventDuration') || '2 hours',
        price: price,
        priceCategory: priceCategory,
        capacity: formData.get('eventCapacity'),
        vibes: vibes,
        image: categoryIcons[formData.get('eventCategory')] || '🎉',
        personalityTags: [], // Not used anymore
        groupSizes: ['solo', 'couple', 'small', 'large'], // Allow all group sizes
        interactivity: 'medium',
        tags: [formData.get('eventCategory'), ...vibes],
        externalLink: formData.get('eventWebsite') || null,
        source: 'User Submitted Event',
        contactEmail: formData.get('contactEmail'),
        userSubmitted: true,
        submittedAt: new Date().toISOString(),
        status: 'pending' // Events start as pending and need admin approval
    };

    // Add to user submitted events
    AppState.userSubmittedEvents.push(newEvent);

    // Do NOT add to events array yet - only approved events should be visible
    // AppState.events.push(newEvent);

    // Save to localStorage
    saveStateToLocalStorage();

    // Reset form
    e.target.reset();

    // Show success message
    alert('Event submitted successfully! Your event is pending administrator approval and will be visible once approved.');

    // Navigate to explore screen
    showScreen('explore');
    displayEvents();
}

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const screenMap = {
        'onboarding': 'onboardingScreen',
        'explore': 'exploreScreen',
        'saved': 'savedScreen',
        'reviews': 'reviewsScreen',
        'admin': 'adminScreen',
        'thisWeek': 'thisWeekScreen'
    };

    document.getElementById(screenMap[screenName]).classList.add('active');
    AppState.currentScreen = screenName;
}

function switchTab(tab) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Show appropriate screen
    showScreen(tab);

    // Load content for the screen
    if (tab === 'explore') {
        displayEvents();
    } else if (tab === 'saved') {
        displaySavedEvents();
    } else if (tab === 'reviews') {
        displayReviews();
    }
}

// Admin Functions
function promptAdminLogin() {
    const password = prompt('Enter admin password:');
    if (password === AppState.adminPassword) {
        AppState.isAdmin = true;
        saveStateToLocalStorage();
        alert('Successfully logged in as administrator');
        showScreen('admin');
        displayAdminEvents();
    } else if (password !== null) {
        alert('Incorrect password');
    }
}

function displayAdminEvents() {
    const container = document.getElementById('adminEventsContainer');
    const scrapeContainer = document.getElementById('manualScrapeContainer');
    const tab = AppState.currentAdminTab;

    // Show/hide appropriate containers
    if (tab === 'scrape') {
        container.style.display = 'none';
        scrapeContainer.style.display = 'block';
        return;
    } else {
        container.style.display = 'block';
        scrapeContainer.style.display = 'none';
    }

    let events = AppState.userSubmittedEvents.filter(e => e.status === tab);

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <h3>No ${tab} events</h3>
                <p>There are currently no events with status: ${tab}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => createAdminEventCard(event)).join('');
}

function createAdminEventCard(event) {
    const priceDisplay = event.price === 0 ? 'FREE' : `$${event.price}`;
    const statusColor = event.status === 'approved' ? '#4caf50' : event.status === 'rejected' ? '#f44336' : '#ff9800';

    return `
        <div class="admin-event-card">
            <div class="admin-event-header">
                <div>
                    <h3>${event.name}</h3>
                    <span class="admin-event-status" style="background: ${statusColor};">${event.status.toUpperCase()}</span>
                </div>
                <span class="event-icon">${event.image}</span>
            </div>
            <div class="admin-event-body">
                <div class="admin-event-meta">
                    <span>📍 ${event.location}</span>
                    <span>📅 ${formatDate(event.date)}</span>
                    <span>⏰ ${event.time}</span>
                    <span>💰 ${priceDisplay}</span>
                </div>
                <p><strong>Category:</strong> ${event.category}</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Vibes:</strong> ${event.vibes.join(', ')}</p>
                <p><strong>Contact:</strong> ${event.contactEmail}</p>
                ${event.externalLink ? `<p><strong>Website:</strong> <a href="${event.externalLink}" target="_blank">${event.externalLink}</a></p>` : ''}
                <p><strong>Submitted:</strong> ${new Date(event.submittedAt).toLocaleString()}</p>
            </div>
            <div class="admin-event-actions">
                ${event.status === 'pending' ? `
                    <button class="btn btn-primary" onclick="approveEvent(${event.id})">✅ Approve</button>
                    <button class="btn btn-secondary" onclick="rejectEvent(${event.id})">❌ Reject</button>
                ` : event.status === 'approved' ? `
                    <button class="btn btn-secondary" onclick="rejectEvent(${event.id})">❌ Reject</button>
                ` : `
                    <button class="btn btn-primary" onclick="approveEvent(${event.id})">✅ Approve</button>
                `}
                <button class="btn btn-secondary" onclick="deleteEvent(${event.id})" style="background: #f44336;">🗑️ Delete</button>
            </div>
        </div>
    `;
}

function approveEvent(eventId) {
    const event = AppState.userSubmittedEvents.find(e => e.id === eventId);
    if (event) {
        event.status = 'approved';
        // Add to main events array
        AppState.events.push(event);
        saveStateToLocalStorage();
        displayAdminEvents();
        alert('Event approved successfully!');
    }
}

function rejectEvent(eventId) {
    const event = AppState.userSubmittedEvents.find(e => e.id === eventId);
    if (event) {
        const wasApproved = event.status === 'approved';
        event.status = 'rejected';
        // Remove from main events array if it was approved
        if (wasApproved) {
            AppState.events = AppState.events.filter(e => e.id !== eventId);
        }
        saveStateToLocalStorage();
        displayAdminEvents();
        alert('Event rejected successfully!');
    }
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to permanently delete this event?')) {
        const event = AppState.userSubmittedEvents.find(e => e.id === eventId);
        if (event && event.status === 'approved') {
            // Remove from main events array
            AppState.events = AppState.events.filter(e => e.id !== eventId);
        }
        // Remove from user submitted events
        AppState.userSubmittedEvents = AppState.userSubmittedEvents.filter(e => e.id !== eventId);
        saveStateToLocalStorage();
        displayAdminEvents();
        alert('Event deleted successfully!');
    }
}

// Manual Scraping Functions
let scrapedEventsCache = [];

function clearScrapeForm() {
    document.getElementById('scrapeUrl').value = '';
    document.getElementById('scrapeVenue').value = '';
    document.getElementById('scrapeCategory').value = 'music';
    document.getElementById('scrapeHtml').value = '';
    document.getElementById('scrapedEventsPreview').innerHTML = '';
    scrapedEventsCache = [];
}

function parseScrapedHtml() {
    const url = document.getElementById('scrapeUrl').value.trim();
    const venue = document.getElementById('scrapeVenue').value.trim();
    const category = document.getElementById('scrapeCategory').value;
    const html = document.getElementById('scrapeHtml').value.trim();

    if (!venue) {
        alert('Please enter a venue name');
        return;
    }

    if (!html) {
        alert('Please paste the HTML source code');
        return;
    }

    try {
        const events = extractEventsFromHtml(html, venue, category, url);

        if (events.length === 0) {
            alert('No events found in the provided HTML. Try a different page or check the HTML structure.');
            return;
        }

        scrapedEventsCache = events;
        displayScrapedEvents(events);
        alert(`Successfully extracted ${events.length} event(s)!`);
    } catch (error) {
        console.error('Error parsing HTML:', error);
        alert('Error parsing HTML: ' + error.message);
    }
}

function extractEventsFromHtml(html, venue, category, sourceUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const events = [];

    // Try to extract JSON-LD structured data first (most reliable)
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
        try {
            const data = JSON.parse(script.textContent);
            const eventArray = Array.isArray(data) ? data : [data];

            eventArray.forEach(item => {
                if (item['@type'] === 'Event' || (item['@type'] && item['@type'].includes('Event'))) {
                    const event = createEventFromJsonLd(item, venue, category, sourceUrl);
                    if (event) events.push(event);
                }
            });
        } catch (e) {
            console.warn('Failed to parse JSON-LD:', e);
        }
    });

    // If no JSON-LD found, try common HTML patterns
    if (events.length === 0) {
        events.push(...extractEventsFromHtmlPatterns(doc, venue, category, sourceUrl));
    }

    return events;
}

function createEventFromJsonLd(jsonData, venue, category, sourceUrl) {
    try {
        const name = jsonData.name || 'Untitled Event';
        const description = jsonData.description || '';

        // Parse date and time
        let date = '';
        let time = '';
        if (jsonData.startDate) {
            const startDate = new Date(jsonData.startDate);
            date = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
            time = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }

        // Parse location
        let location = '';
        if (jsonData.location) {
            if (typeof jsonData.location === 'string') {
                location = jsonData.location;
            } else if (jsonData.location.address) {
                const addr = jsonData.location.address;
                location = typeof addr === 'string' ? addr :
                    `${addr.streetAddress || ''}, ${addr.addressLocality || ''}, ${addr.addressRegion || ''} ${addr.postalCode || ''}`.trim();
            }
        }

        // Parse price
        let price = 0;
        let priceCategory = 'free';
        if (jsonData.offers) {
            const offer = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
            if (offer.price) {
                price = parseFloat(offer.price) || 0;
            }
        }

        if (price > 0 && price <= 20) priceCategory = 'budget';
        else if (price > 20 && price <= 50) priceCategory = 'moderate';
        else if (price > 50) priceCategory = 'premium';

        // Get external link
        const externalLink = jsonData.url || sourceUrl || '';

        return {
            id: Date.now() + Math.random(),
            name: name,
            venue: venue,
            category: category,
            description: description.substring(0, 500),
            location: location || venue,
            date: date || new Date().toISOString().split('T')[0],
            time: time || 'TBD',
            duration: '2-3 hours',
            price: price,
            priceCategory: priceCategory,
            capacity: 'medium',
            image: getCategoryEmoji(category),
            personalityTags: inferPersonalityTags(category),
            vibes: inferVibes(category, description),
            groupSizes: ['couple', 'small', 'large'],
            interactivity: 'medium',
            tags: [category, venue.toLowerCase()],
            externalLink: externalLink,
            source: `Scraped from ${venue}`,
            contactEmail: 'admin@searchcentralfl.com',
            userSubmitted: true,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
    } catch (error) {
        console.error('Error creating event from JSON-LD:', error);
        return null;
    }
}

function extractEventsFromHtmlPatterns(doc, venue, category, sourceUrl) {
    const events = [];

    // Common event container selectors
    const selectors = [
        '.event', '.event-item', '.event-card',
        '[class*="event"]', '[itemtype*="Event"]',
        'article', '.tribe-events-list-event-row',
        '.eventlist-event'
    ];

    let eventElements = [];
    for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
            eventElements = Array.from(elements);
            break;
        }
    }

    // If no event containers found, try to find individual components
    if (eventElements.length === 0) {
        // Look for headings that might be event titles
        const headings = doc.querySelectorAll('h1, h2, h3, h4');
        eventElements = Array.from(headings).slice(0, 10); // Limit to first 10
    }

    eventElements.forEach((element, index) => {
        try {
            const name = extractText(element, 'h1, h2, h3, h4, .event-title, [class*="title"]') || `Event ${index + 1}`;
            const description = extractText(element, 'p, .description, [class*="description"]') || '';
            const dateText = extractText(element, 'time, .date, [class*="date"]') || '';
            const timeText = extractText(element, '.time, [class*="time"]') || '';
            const priceText = extractText(element, '.price, [class*="price"]') || '';

            // Try to parse date
            let date = '';
            if (dateText) {
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate)) {
                    date = parsedDate.toISOString().split('T')[0];
                }
            }
            if (!date) {
                date = new Date().toISOString().split('T')[0];
            }

            // Parse price
            let price = 0;
            const priceMatch = priceText.match(/\$?(\d+(?:\.\d{2})?)/);
            if (priceMatch) {
                price = parseFloat(priceMatch[1]);
            }

            let priceCategory = 'free';
            if (price > 0 && price <= 20) priceCategory = 'budget';
            else if (price > 20 && price <= 50) priceCategory = 'moderate';
            else if (price > 50) priceCategory = 'premium';

            // Try to find external link
            const linkElement = element.querySelector('a[href]');
            let externalLink = sourceUrl;
            if (linkElement) {
                const href = linkElement.getAttribute('href');
                if (href.startsWith('http')) {
                    externalLink = href;
                } else if (sourceUrl && href) {
                    try {
                        externalLink = new URL(href, sourceUrl).href;
                    } catch (e) {
                        externalLink = sourceUrl;
                    }
                }
            }

            events.push({
                id: Date.now() + Math.random() + index,
                name: name.substring(0, 200),
                venue: venue,
                category: category,
                description: description.substring(0, 500) || 'No description available',
                location: venue,
                date: date,
                time: timeText || 'TBD',
                duration: '2-3 hours',
                price: price,
                priceCategory: priceCategory,
                capacity: 'medium',
                image: getCategoryEmoji(category),
                personalityTags: inferPersonalityTags(category),
                vibes: inferVibes(category, description),
                groupSizes: ['couple', 'small', 'large'],
                interactivity: 'medium',
                tags: [category, venue.toLowerCase()],
                externalLink: externalLink,
                source: `Scraped from ${venue}`,
                contactEmail: 'admin@searchcentralfl.com',
                userSubmitted: true,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            });
        } catch (error) {
            console.error('Error extracting event:', error);
        }
    });

    return events;
}

function extractText(element, selector) {
    const el = element.querySelector(selector) || element;
    return el.textContent.trim();
}

function getCategoryEmoji(category) {
    const emojiMap = {
        music: '🎵',
        food: '🍽️',
        arts: '🎨',
        sports: '⚽',
        outdoor: '🌳',
        education: '📚',
        community: '🤝'
    };
    return emojiMap[category] || '📅';
}

function inferPersonalityTags(category) {
    const tagMap = {
        music: ['E', 'N', 'F', 'P'],
        food: ['E', 'S', 'F', 'J'],
        arts: ['I', 'N', 'F', 'P'],
        sports: ['E', 'S', 'T', 'J'],
        outdoor: ['E', 'S', 'F', 'P'],
        education: ['I', 'N', 'T', 'J'],
        community: ['E', 'S', 'F', 'J']
    };
    return tagMap[category] || ['E', 'N', 'F', 'P'];
}

function inferVibes(category, description) {
    const vibeMap = {
        music: ['energetic', 'social', 'creative'],
        food: ['relaxed', 'social', 'indulgent'],
        arts: ['creative', 'intellectual', 'inspiring'],
        sports: ['energetic', 'competitive', 'active'],
        outdoor: ['adventurous', 'peaceful', 'refreshing'],
        education: ['intellectual', 'inspiring', 'focused'],
        community: ['social', 'welcoming', 'meaningful']
    };
    return vibeMap[category] || ['social', 'fun'];
}

function displayScrapedEvents(events) {
    const container = document.getElementById('scrapedEventsPreview');

    if (events.length === 0) {
        container.innerHTML = '<p>No events to display</p>';
        return;
    }

    container.innerHTML = `
        <div class="scraped-events-header">
            <h3>Extracted Events (${events.length})</h3>
            <div class="bulk-actions">
                <button class="btn btn-primary" onclick="bulkApproveScrapedEvents()">✅ Approve All</button>
                <button class="btn btn-secondary" onclick="clearScrapeForm()">Clear All</button>
            </div>
        </div>
        <div class="scraped-events-grid">
            ${events.map((event, index) => createScrapedEventCard(event, index)).join('')}
        </div>
    `;
}

function createScrapedEventCard(event, index) {
    const priceDisplay = event.price === 0 ? 'FREE' : `$${event.price}`;

    return `
        <div class="scraped-event-card" id="scraped-event-${index}">
            <div class="scraped-event-header">
                <span class="event-icon">${event.image}</span>
                <h4>${event.name}</h4>
            </div>
            <div class="scraped-event-body">
                <div class="event-field">
                    <label>Venue:</label>
                    <input type="text" value="${event.venue}" onchange="updateScrapedEvent(${index}, 'venue', this.value)">
                </div>
                <div class="event-field">
                    <label>Date:</label>
                    <input type="date" value="${event.date}" onchange="updateScrapedEvent(${index}, 'date', this.value)">
                </div>
                <div class="event-field">
                    <label>Time:</label>
                    <input type="text" value="${event.time}" onchange="updateScrapedEvent(${index}, 'time', this.value)">
                </div>
                <div class="event-field">
                    <label>Price ($):</label>
                    <input type="number" value="${event.price}" step="0.01" onchange="updateScrapedEvent(${index}, 'price', parseFloat(this.value))">
                </div>
                <div class="event-field">
                    <label>Category:</label>
                    <select onchange="updateScrapedEvent(${index}, 'category', this.value)">
                        <option value="music" ${event.category === 'music' ? 'selected' : ''}>Music</option>
                        <option value="food" ${event.category === 'food' ? 'selected' : ''}>Food & Drink</option>
                        <option value="arts" ${event.category === 'arts' ? 'selected' : ''}>Arts & Culture</option>
                        <option value="sports" ${event.category === 'sports' ? 'selected' : ''}>Sports & Fitness</option>
                        <option value="outdoor" ${event.category === 'outdoor' ? 'selected' : ''}>Outdoor & Nature</option>
                        <option value="education" ${event.category === 'education' ? 'selected' : ''}>Education & Learning</option>
                        <option value="community" ${event.category === 'community' ? 'selected' : ''}>Community & Social</option>
                    </select>
                </div>
                <div class="event-field">
                    <label>Description:</label>
                    <textarea rows="3" onchange="updateScrapedEvent(${index}, 'description', this.value)">${event.description}</textarea>
                </div>
                <div class="event-field">
                    <label>External Link:</label>
                    <input type="url" value="${event.externalLink}" onchange="updateScrapedEvent(${index}, 'externalLink', this.value)">
                </div>
            </div>
            <div class="scraped-event-actions">
                <button class="btn btn-primary btn-sm" onclick="approveSingleScrapedEvent(${index})">✅ Approve</button>
                <button class="btn btn-secondary btn-sm" onclick="removeScrapedEvent(${index})">❌ Remove</button>
            </div>
        </div>
    `;
}

function updateScrapedEvent(index, field, value) {
    if (scrapedEventsCache[index]) {
        scrapedEventsCache[index][field] = value;

        // Update price category if price changed
        if (field === 'price') {
            const price = parseFloat(value);
            if (price === 0) scrapedEventsCache[index].priceCategory = 'free';
            else if (price <= 20) scrapedEventsCache[index].priceCategory = 'budget';
            else if (price <= 50) scrapedEventsCache[index].priceCategory = 'moderate';
            else scrapedEventsCache[index].priceCategory = 'premium';
        }

        // Update emoji if category changed
        if (field === 'category') {
            scrapedEventsCache[index].image = getCategoryEmoji(value);
            scrapedEventsCache[index].personalityTags = inferPersonalityTags(value);
            scrapedEventsCache[index].vibes = inferVibes(value, scrapedEventsCache[index].description);
        }
    }
}

function removeScrapedEvent(index) {
    scrapedEventsCache.splice(index, 1);
    displayScrapedEvents(scrapedEventsCache);
}

function approveSingleScrapedEvent(index) {
    const event = scrapedEventsCache[index];
    if (!event) return;

    // Generate a proper unique ID
    event.id = Date.now() + Math.random();

    // Add to user submitted events
    AppState.userSubmittedEvents.push(event);
    saveStateToLocalStorage();

    // Remove from cache
    scrapedEventsCache.splice(index, 1);
    displayScrapedEvents(scrapedEventsCache);

    alert(`Event "${event.name}" added to pending events!`);
}

function bulkApproveScrapedEvents() {
    if (scrapedEventsCache.length === 0) {
        alert('No events to approve');
        return;
    }

    if (!confirm(`Approve all ${scrapedEventsCache.length} event(s)?`)) {
        return;
    }

    scrapedEventsCache.forEach(event => {
        event.id = Date.now() + Math.random();
        AppState.userSubmittedEvents.push(event);
    });

    saveStateToLocalStorage();

    const count = scrapedEventsCache.length;
    scrapedEventsCache = [];
    displayScrapedEvents(scrapedEventsCache);

    alert(`Successfully added ${count} event(s) to pending events!`);
}

// Simplified Recommendation Engine
function calculateEventScore(event) {
    // Simple scoring based on recency and price
    let score = 50; // Base score

    // Boost score for user-submitted events
    if (event.userSubmitted) {
        score += 10;
    }

    // Boost recent events
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysUntilEvent = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilEvent >= 0 && daysUntilEvent <= 7) {
        score += 20; // Events within a week
    } else if (daysUntilEvent > 7 && daysUntilEvent <= 30) {
        score += 10; // Events within a month
    }

    // Slightly boost free events
    if (event.priceCategory === 'free') {
        score += 5;
    }

    // Cap at 100
    return Math.min(100, score);
}

// Event Display Functions
function displayEvents() {
    filterAndDisplayEvents();
}

function filterAndDisplayEvents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const sortBy = document.getElementById('sortBy').value;

    let filteredEvents = AppState.events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm) ||
                            event.description.toLowerCase().includes(searchTerm) ||
                            event.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        const matchesCategory = category === 'all' || event.category === category;

        return matchesSearch && matchesCategory;
    });

    // Calculate scores for all events
    filteredEvents = filteredEvents.map(event => ({
        ...event,
        matchScore: calculateEventScore(event)
    }));

    // Sort events
    filteredEvents.sort((a, b) => {
        switch (sortBy) {
            case 'match':
                return b.matchScore - a.matchScore;
            case 'date':
                return new Date(a.date) - new Date(b.date);
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            default:
                return b.matchScore - a.matchScore;
        }
    });

    renderEventCards('eventsGrid', filteredEvents);
}

function displaySavedEvents() {
    const savedEventsList = AppState.events
        .filter(event => AppState.savedEvents.has(event.id))
        .map(event => ({
            ...event,
            matchScore: calculateEventScore(event)
        }));

    renderEventCards('savedEventsGrid', savedEventsList);
}

function renderEventCards(containerId, events) {
    const container = document.getElementById(containerId);

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🎭</span>
                <h3>No events found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => createEventCard(event)).join('');

    // Add event listeners to cards
    container.querySelectorAll('.event-card').forEach(card => {
        const eventId = parseInt(card.dataset.eventId);
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-btn')) {
                showEventDetails(eventId);
            }
        });
    });

    // Add event listeners to save buttons
    container.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = parseInt(btn.dataset.eventId);
            toggleSaveEvent(eventId);
        });
    });
}

function createEventCard(event) {
    const isSaved = AppState.savedEvents.has(event.id);
    const priceDisplay = event.price === 0 ? 'FREE' : `$${event.price}`;
    const priceClass = event.price === 0 ? 'free' : '';

    return `
        <div class="event-card" data-event-id="${event.id}">
            ${event.locationImage ? `
            <div class="event-card-image" style="background-image: url('${event.locationImage}');">
                ${event.userSubmitted ? `<span class="match-score">Community Event</span>` : ''}
            </div>
            ` : `
            <div class="event-card-header">
                <span class="event-icon">${event.image}</span>
                ${event.userSubmitted ? `<span class="match-score">Community Event</span>` : ''}
            </div>
            `}
            <div class="event-card-body">
                <h3>${event.name}</h3>
                <div class="event-meta">
                    <span class="meta-item">📍 ${event.location}</span>
                    <span class="meta-item">📅 ${formatDate(event.date)}</span>
                    <span class="meta-item">⏰ ${event.time}</span>
                </div>
                <p class="event-description">${event.description}</p>
                <div class="event-tags">
                    ${event.vibes.slice(0, 3).map(vibe => `<span class="tag">${vibe}</span>`).join('')}
                </div>
                <div class="event-card-footer">
                    <span class="price-tag ${priceClass}">${priceDisplay}</span>
                    <div class="action-buttons">
                        ${event.externalLink ? `
                        <a href="${event.externalLink}" target="_blank" rel="noopener noreferrer" class="icon-btn link-btn" title="Visit website" onclick="event.stopPropagation();">
                            🔗
                        </a>
                        ` : ''}
                        <button class="icon-btn save-btn ${isSaved ? 'active' : ''}" data-event-id="${event.id}" title="${isSaved ? 'Unsave' : 'Save'}">
                            ${isSaved ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toggleSaveEvent(eventId) {
    if (AppState.savedEvents.has(eventId)) {
        AppState.savedEvents.delete(eventId);
    } else {
        AppState.savedEvents.add(eventId);
    }
    saveStateToLocalStorage();

    // Update UI
    if (AppState.currentScreen === 'explore') {
        displayEvents();
    } else if (AppState.currentScreen === 'saved') {
        displaySavedEvents();
    }
}

// Event Details Modal
function showEventDetails(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;

    AppState.currentEventId = eventId;
    const isSaved = AppState.savedEvents.has(eventId);
    const hasReview = AppState.reviews.some(r => r.eventId === eventId);

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header">
            <span class="modal-icon">${event.image}</span>
            <h2 class="modal-title">${event.name}</h2>
            <p class="modal-subtitle">${event.location}</p>
            ${event.userSubmitted ? `<div class="match-score" style="display: inline-block; margin-top: 1rem;">Community Event</div>` : ''}
        </div>

        <div class="modal-section">
            <h4>📋 Event Details</h4>
            <div class="modal-grid">
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Time:</span>
                    <span class="info-value">${event.time}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${event.duration}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Price:</span>
                    <span class="info-value">${event.price === 0 ? 'FREE' : '$' + event.price}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${event.category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Venue:</span>
                    <span class="info-value">${event.venue}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h4>📝 Description</h4>
            <p>${event.description}</p>
        </div>

        <div class="modal-section">
            <h4>🏷️ Tags</h4>
            <div class="event-tags">
                ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>

        ${event.source ? `
        <div class="modal-section">
            <h4>ℹ️ Source</h4>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">${event.source}</p>
            ${event.locationImageSource ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">📸 Image: ${event.locationImageSource}</p>` : ''}
            ${event.contactEmail ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">📧 Contact: ${event.contactEmail}</p>` : ''}
        </div>
        ` : ''}

        <div class="modal-actions">
            ${event.externalLink ? `
            <a href="${event.externalLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="text-decoration: none; text-align: center;">
                🔗 Visit Website
            </a>
            ` : ''}
            <button class="btn btn-secondary" onclick="toggleSaveEvent(${eventId}); showEventDetails(${eventId})">
                ${isSaved ? '❤️ Saved' : '🤍 Save Event'}
            </button>
            <button class="btn btn-primary" onclick="openReviewForm(${eventId})">
                ${hasReview ? '✏️ Edit Review' : '⭐ Write Review'}
            </button>
        </div>
    `;

    document.getElementById('eventModal').classList.add('active');
}


// Review System
function openReviewForm(eventId) {
    AppState.currentEventId = eventId;
    const event = AppState.events.find(e => e.id === eventId);

    document.getElementById('eventModal').classList.remove('active');
    document.getElementById('reviewModal').classList.add('active');

    // Check if user has already reviewed
    const existingReview = AppState.reviews.find(r => r.eventId === eventId);
    if (existingReview) {
        document.getElementById('reviewText').value = existingReview.text;
        setStarRating(existingReview.rating);
    } else {
        document.getElementById('reviewText').value = '';
        setStarRating(0);
    }

    // Clear recommendations
    document.getElementById('recommendationsContainer').innerHTML = '';
}

function handleStarRating(e) {
    const rating = parseInt(e.target.dataset.rating);
    setStarRating(rating);
}

function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

function resetStarHover() {
    const filledStars = document.querySelectorAll('.star.filled');
    const rating = filledStars.length;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

function setStarRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            star.textContent = '★';
        } else {
            star.classList.remove('filled');
            star.textContent = '☆';
        }
    });
}

function handleReviewSubmit() {
    const rating = document.querySelectorAll('.star.filled').length;
    const text = document.getElementById('reviewText').value.trim();

    if (rating === 0) {
        alert('Please select a rating');
        return;
    }

    if (text.length < 10) {
        alert('Please write at least 10 characters in your review');
        return;
    }

    // Create or update review
    const reviewIndex = AppState.reviews.findIndex(r => r.eventId === AppState.currentEventId);
    const review = {
        eventId: AppState.currentEventId,
        rating,
        text,
        date: new Date().toISOString()
    };

    if (reviewIndex >= 0) {
        AppState.reviews[reviewIndex] = review;
    } else {
        AppState.reviews.push(review);
    }

    saveStateToLocalStorage();

    // Perform sentiment analysis and generate recommendations
    const sentiment = analyzeSentiment(text);
    const recommendations = generateContextualRecommendations(text, sentiment, rating);

    displayRecommendations(recommendations, sentiment);
}

// Sentiment Analysis
function analyzeSentiment(text) {
    const lowerText = text.toLowerCase();

    // Define sentiment keywords
    const positiveWords = ['great', 'amazing', 'wonderful', 'fantastic', 'loved', 'awesome', 'excellent', 'perfect', 'fun', 'enjoyed', 'beautiful', 'incredible'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'worst', 'hate', 'boring', 'waste', 'overpriced', 'crowded', 'loud'];

    // Price-related keywords
    const priceComplaints = ['expensive', 'overpriced', 'costly', 'price', 'money', 'budget', 'afford', 'cheap'];
    const crowdComplaints = ['crowded', 'packed', 'busy', 'people', 'crowd', 'too many', 'overwhelming'];
    const boringComplaints = ['boring', 'dull', 'uninteresting', 'slow', 'nothing', 'bland', 'monotonous'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
    });

    // Determine concerns
    const concerns = [];
    if (priceComplaints.some(word => lowerText.includes(word))) {
        concerns.push('price');
    }
    if (crowdComplaints.some(word => lowerText.includes(word))) {
        concerns.push('crowd');
    }
    if (boringComplaints.some(word => lowerText.includes(word))) {
        concerns.push('boring');
    }

    // Determine overall sentiment
    let sentiment = 'neutral';
    if (positiveCount > negativeCount + 1) {
        sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
    }

    return {
        sentiment,
        concerns,
        positiveCount,
        negativeCount
    };
}

// Generate Contextual Recommendations
function generateContextualRecommendations(reviewText, sentiment, rating) {
    const recommendations = [];
    const currentEvent = AppState.events.find(e => e.id === AppState.currentEventId);

    // If rating is high, suggest similar events
    if (rating >= 4) {
        const similarEvents = AppState.events
            .filter(e => e.id !== AppState.currentEventId)
            .map(e => ({
                event: e,
                similarity: calculateSimilarity(currentEvent, e)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3);

        similarEvents.forEach(({ event }) => {
            recommendations.push({
                event,
                reason: `Since you enjoyed ${currentEvent.name}, you might love this similar ${event.category} experience! 🎉`,
                badges: ['similar'],
                emoji: '✨'
            });
        });
    }

    // Address specific concerns
    if (sentiment.concerns.includes('price')) {
        // Suggest budget-friendly alternatives
        const budgetEvents = AppState.events
            .filter(e => e.id !== AppState.currentEventId && (e.priceCategory === 'free' || e.priceCategory === 'budget'))
            .filter(e => e.category === currentEvent.category || e.vibes.some(v => currentEvent.vibes.includes(v)))
            .sort((a, b) => a.price - b.price)
            .slice(0, 2);

        budgetEvents.forEach(event => {
            const priceText = event.price === 0 ? 'completely free' : `only $${event.price}`;
            recommendations.push({
                event,
                reason: `We noticed price was a concern. This ${event.category} event is ${priceText} and offers a similar vibe without breaking the bank! 💰`,
                badges: ['budget-friendly'],
                emoji: '💵'
            });
        });
    }

    if (sentiment.concerns.includes('crowd')) {
        // Suggest intimate events
        const intimateEvents = AppState.events
            .filter(e => e.id !== AppState.currentEventId && e.capacity === 'small')
            .filter(e => e.category === currentEvent.category || e.vibes.some(v => currentEvent.vibes.includes(v)))
            .sort((a, b) => calculateEventScore(b) - calculateEventScore(a))
            .slice(0, 2);

        intimateEvents.forEach(event => {
            recommendations.push({
                event,
                reason: `Looking for something more intimate? This small-capacity event offers a peaceful, uncrowded experience where you can really enjoy the atmosphere. 🌿`,
                badges: ['intimate'],
                emoji: '🤫'
            });
        });
    }

    if (sentiment.concerns.includes('boring')) {
        // Suggest highly interactive events
        const interactiveEvents = AppState.events
            .filter(e => e.id !== AppState.currentEventId && e.interactivity === 'high')
            .sort((a, b) => calculateEventScore(b) - calculateEventScore(a))
            .slice(0, 2);

        interactiveEvents.forEach(event => {
            recommendations.push({
                event,
                reason: `Want more engagement? This highly interactive event lets you participate actively rather than just observe. Get ready for hands-on fun! 🎮`,
                badges: ['interactive'],
                emoji: '⚡'
            });
        });
    }

    // If no specific concerns but negative sentiment, suggest different category
    if (rating <= 2 && sentiment.concerns.length === 0) {
        const differentCategory = AppState.events
            .filter(e => e.id !== AppState.currentEventId && e.category !== currentEvent.category)
            .sort((a, b) => calculateEventScore(b) - calculateEventScore(a))
            .slice(0, 2);

        differentCategory.forEach(event => {
            recommendations.push({
                event,
                reason: `Sometimes a change of pace is exactly what you need! This ${event.category} event offers a completely different vibe. 🔄`,
                badges: ['fresh-perspective'],
                emoji: '🌟'
            });
        });
    }

    // Remove duplicates
    const uniqueRecommendations = [];
    const seenIds = new Set();

    recommendations.forEach(rec => {
        if (!seenIds.has(rec.event.id)) {
            seenIds.add(rec.event.id);
            uniqueRecommendations.push(rec);
        }
    });

    return uniqueRecommendations.slice(0, 4); // Limit to 4 recommendations
}

function calculateSimilarity(event1, event2) {
    let similarity = 0;

    // Same category
    if (event1.category === event2.category) similarity += 20;

    // Shared vibes
    const sharedVibes = event1.vibes.filter(v => event2.vibes.includes(v)).length;
    similarity += sharedVibes * 10;

    // Similar price range
    if (event1.priceCategory === event2.priceCategory) similarity += 15;

    // Same time preference
    if (event1.time === event2.time) similarity += 10;

    // Similar interactivity
    if (event1.interactivity === event2.interactivity) similarity += 10;

    return similarity;
}

// Display Recommendations
function displayRecommendations(recommendations, sentiment) {
    const container = document.getElementById('recommendationsContainer');

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="recommendations-header">
                <h3>Thank you for your review! 🙏</h3>
                <p>We've saved your feedback. Check out the Explore tab for more events!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="recommendations-header">
            <h3>You might also enjoy these events...</h3>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Based on your feedback, here are some personalized recommendations just for you.</p>
        </div>
        ${recommendations.map(rec => `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <div>
                        <div class="recommendation-title">${rec.emoji} ${rec.event.name}</div>
                        <div class="recommendation-badges">
                            ${rec.badges.map(badge => `
                                <span class="badge ${badge}">${badge.replace('-', ' ')}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <p class="recommendation-reason">${rec.reason}</p>
                <div class="recommendation-details">
                    <span>📍 ${rec.event.location}</span>
                    <span>💰 ${rec.event.price === 0 ? 'FREE' : '$' + rec.event.price}</span>
                    <span>📅 ${formatDate(rec.event.date)}</span>
                </div>
                <button class="view-event-btn" onclick="viewRecommendedEvent(${rec.event.id})">
                    View Event Details →
                </button>
            </div>
        `).join('')}
    `;
}

function viewRecommendedEvent(eventId) {
    document.getElementById('reviewModal').classList.remove('active');
    showEventDetails(eventId);
}

// Display Reviews
function displayReviews() {
    const container = document.getElementById('reviewsContainer');

    if (AppState.reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⭐</span>
                <h3>No reviews yet</h3>
                <p>Attend some events and share your experiences!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = AppState.reviews
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(review => {
            const event = AppState.events.find(e => e.id === review.eventId);
            return `
                <div class="review-item">
                    <div class="review-header">
                        <div>
                            <h3 class="review-event-name">${event.name}</h3>
                            <p class="review-date">${new Date(review.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>
                        <div class="review-rating">
                            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                        </div>
                    </div>
                    <p class="review-text">${review.text}</p>
                    <button class="btn btn-secondary" onclick="openReviewForm(${review.eventId})">
                        Edit Review
                    </button>
                </div>
            `;
        })
        .join('');
}

// Back to Top Button Functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Make functions globally accessible for onclick handlers
window.toggleSaveEvent = toggleSaveEvent;
window.showEventDetails = showEventDetails;
window.openReviewForm = openReviewForm;
window.viewRecommendedEvent = viewRecommendedEvent;
window.approveEvent = approveEvent;
window.rejectEvent = rejectEvent;
window.deleteEvent = deleteEvent;
window.showScreen = showScreen;
