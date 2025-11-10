// Central Florida Events App - Main Application Logic

// State Management
const AppState = {
    currentStep: 1,
    totalSteps: 8,
    userProfile: null,
    savedEvents: new Set(),
    reviews: [],
    currentScreen: 'onboarding',
    currentEventId: null,
    events: EVENTS_DATA
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    initializeApp();
});

// Load state from localStorage
function loadStateFromLocalStorage() {
    const savedProfile = localStorage.getItem('userProfile');
    const savedEvents = localStorage.getItem('savedEvents');
    const savedReviews = localStorage.getItem('reviews');

    if (savedProfile) {
        AppState.userProfile = JSON.parse(savedProfile);
    }
    if (savedEvents) {
        AppState.savedEvents = new Set(JSON.parse(savedEvents));
    }
    if (savedReviews) {
        AppState.reviews = JSON.parse(savedReviews);
    }
}

// Save state to localStorage
function saveStateToLocalStorage() {
    localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
    localStorage.setItem('savedEvents', JSON.stringify([...AppState.savedEvents]));
    localStorage.setItem('reviews', JSON.stringify(AppState.reviews));
}

// Initialize the application
function initializeApp() {
    setupEventListeners();

    if (AppState.userProfile) {
        updateProfileDisplay();
        showScreen('explore');
        displayEvents();
    } else {
        showScreen('onboarding');
    }
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

    // Onboarding navigation
    document.getElementById('nextBtn').addEventListener('click', handleNext);
    document.getElementById('prevBtn').addEventListener('click', handlePrevious);
    document.getElementById('startOnboarding').addEventListener('click', () => {
        AppState.userProfile = null;
        AppState.currentStep = 1;
        saveStateToLocalStorage();
        showScreen('onboarding');
        updateOnboardingStep();
        closeMenu();
    });

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

    // Radio button listeners for onboarding
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', validateCurrentStep);
    });
    document.querySelectorAll('input[name="vibes"]').forEach(input => {
        input.addEventListener('change', validateCurrentStep);
    });
}

// Onboarding Flow Functions
function handleNext() {
    if (!validateCurrentStep()) {
        return;
    }

    if (AppState.currentStep < AppState.totalSteps) {
        AppState.currentStep++;
        updateOnboardingStep();
    } else {
        completeOnboarding();
    }
}

function handlePrevious() {
    if (AppState.currentStep > 1) {
        AppState.currentStep--;
        updateOnboardingStep();
    }
}

function updateOnboardingStep() {
    // Update progress bar
    const progress = (AppState.currentStep / AppState.totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('currentStep').textContent = AppState.currentStep;

    // Show/hide steps
    document.querySelectorAll('.onboarding-step').forEach((step, index) => {
        if (index + 1 === AppState.currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (AppState.currentStep === 1) {
        prevBtn.style.visibility = 'hidden';
    } else {
        prevBtn.style.visibility = 'visible';
    }

    if (AppState.currentStep === AppState.totalSteps) {
        nextBtn.textContent = 'Complete';
    } else {
        nextBtn.textContent = 'Next';
    }

    validateCurrentStep();
}

function validateCurrentStep() {
    const nextBtn = document.getElementById('nextBtn');
    let isValid = false;

    switch (AppState.currentStep) {
        case 1:
            isValid = true; // Welcome screen
            break;
        case 2:
            isValid = document.querySelector('input[name="energy"]:checked') !== null;
            break;
        case 3:
            isValid = document.querySelector('input[name="sensing"]:checked') !== null;
            break;
        case 4:
            isValid = document.querySelector('input[name="thinking"]:checked') !== null;
            break;
        case 5:
            isValid = document.querySelector('input[name="judging"]:checked') !== null;
            break;
        case 6:
            const checkedVibes = document.querySelectorAll('input[name="vibes"]:checked');
            isValid = checkedVibes.length >= 3;
            break;
        case 7:
            isValid = document.querySelector('input[name="budget"]:checked') !== null;
            break;
        case 8:
            const groupSize = document.querySelector('input[name="groupSize"]:checked') !== null;
            const timePreference = document.querySelector('input[name="timePreference"]:checked') !== null;
            isValid = groupSize && timePreference;
            break;
    }

    nextBtn.disabled = !isValid;
    return isValid;
}

function completeOnboarding() {
    // Collect all user data
    const energy = document.querySelector('input[name="energy"]:checked').value;
    const sensing = document.querySelector('input[name="sensing"]:checked').value;
    const thinking = document.querySelector('input[name="thinking"]:checked').value;
    const judging = document.querySelector('input[name="judging"]:checked').value;

    const vibes = Array.from(document.querySelectorAll('input[name="vibes"]:checked'))
        .map(input => input.value);

    const budget = document.querySelector('input[name="budget"]:checked').value;
    const groupSize = document.querySelector('input[name="groupSize"]:checked').value;
    const timePreference = document.querySelector('input[name="timePreference"]:checked').value;

    // Create personality type
    const personalityType = `${energy}${sensing}${thinking}${judging}`;

    // Save user profile
    AppState.userProfile = {
        personalityType,
        personalityTraits: [energy, sensing, thinking, judging],
        vibes,
        budget,
        groupSize,
        timePreference,
        createdAt: new Date().toISOString()
    };

    saveStateToLocalStorage();
    updateProfileDisplay();
    showScreen('explore');
    displayEvents();
}

function updateProfileDisplay() {
    const profileInfo = document.getElementById('profileInfo');

    if (AppState.userProfile) {
        profileInfo.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <div style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">${AppState.userProfile.personalityType}</div>
                <div style="font-size: 0.875rem; opacity: 0.9;">${getPersonalityDescription(AppState.userProfile.personalityType)}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.75rem; border-radius: 12px; margin-bottom: 1rem; backdrop-filter: blur(10px);">
                <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;">Your vibes:</div>
                <div style="font-size: 0.875rem; font-weight: 600;">
                    ${AppState.userProfile.vibes.slice(0, 3).map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(' • ')}
                </div>
            </div>
            <button class="btn-profile" id="resetProfile" style="background: white; color: var(--primary-color); border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.2s;">Retake Quiz 🔄</button>
        `;

        document.getElementById('resetProfile').addEventListener('click', () => {
            if (confirm('Are you sure you want to create a new profile? This will reset your preferences.')) {
                AppState.userProfile = null;
                AppState.currentStep = 1;
                saveStateToLocalStorage();
                showScreen('onboarding');
                updateOnboardingStep();
            }
        });
    }
}

function getPersonalityDescription(type) {
    const descriptions = {
        'ESTJ': 'The Organizer',
        'ESTP': 'The Adventurer',
        'ESFJ': 'The Social Butterfly',
        'ESFP': 'The Entertainer',
        'ENTJ': 'The Leader',
        'ENTP': 'The Innovator',
        'ENFJ': 'The Connector',
        'ENFP': 'The Explorer',
        'ISTJ': 'The Planner',
        'ISTP': 'The Craftsperson',
        'ISFJ': 'The Nurturer',
        'ISFP': 'The Artist',
        'INTJ': 'The Strategist',
        'INTP': 'The Thinker',
        'INFJ': 'The Idealist',
        'INFP': 'The Dreamer'
    };
    return descriptions[type] || 'Unique Individual';
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
        'reviews': 'reviewsScreen'
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

// Recommendation Engine
function calculateEventScore(event) {
    if (!AppState.userProfile) return 50; // Default score if no profile

    let score = 0;
    let maxScore = 0;

    // Personality matching (40 points max)
    const personalityWeight = 40;
    const matchingTraits = event.personalityTags.filter(tag =>
        AppState.userProfile.personalityTraits.includes(tag)
    ).length;
    score += (matchingTraits / 4) * personalityWeight;
    maxScore += personalityWeight;

    // Vibe matching (30 points max)
    const vibeWeight = 30;
    const matchingVibes = event.vibes.filter(vibe =>
        AppState.userProfile.vibes.includes(vibe)
    ).length;
    score += (matchingVibes / Math.min(event.vibes.length, 3)) * vibeWeight;
    maxScore += vibeWeight;

    // Budget matching (15 points max)
    const budgetWeight = 15;
    if (event.priceCategory === AppState.userProfile.budget) {
        score += budgetWeight;
    } else if (
        (AppState.userProfile.budget === 'free' && event.priceCategory === 'budget') ||
        (AppState.userProfile.budget === 'budget' && event.priceCategory === 'moderate') ||
        (AppState.userProfile.budget === 'moderate' && event.priceCategory === 'budget') ||
        (AppState.userProfile.budget === 'premium' && event.priceCategory === 'moderate')
    ) {
        score += budgetWeight * 0.5;
    }
    maxScore += budgetWeight;

    // Group size matching (10 points max)
    const groupWeight = 10;
    if (event.groupSizes.includes(AppState.userProfile.groupSize)) {
        score += groupWeight;
    }
    maxScore += groupWeight;

    // Time preference matching (5 points max)
    const timeWeight = 5;
    if (event.time === AppState.userProfile.timePreference) {
        score += timeWeight;
    }
    maxScore += timeWeight;

    // Convert to percentage
    return Math.round((score / maxScore) * 100);
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
                ${AppState.userProfile ? `<span class="match-score">${event.matchScore}% Match</span>` : ''}
            </div>
            ` : `
            <div class="event-card-header">
                <span class="event-icon">${event.image}</span>
                ${AppState.userProfile ? `<span class="match-score">${event.matchScore}% Match</span>` : ''}
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
    const matchScore = calculateEventScore(event);
    const isSaved = AppState.savedEvents.has(eventId);
    const hasReview = AppState.reviews.some(r => r.eventId === eventId);

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header">
            <span class="modal-icon">${event.image}</span>
            <h2 class="modal-title">${event.name}</h2>
            <p class="modal-subtitle">${event.location}</p>
            ${AppState.userProfile ? `<div class="match-score" style="display: inline-block; margin-top: 1rem;">${matchScore}% Match</div>` : ''}
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

        ${AppState.userProfile ? `
        <div class="modal-section">
            <h4>✨ Why This Matches You</h4>
            <div class="personality-matches">
                ${event.personalityTags.map(tag =>
                    AppState.userProfile.personalityTraits.includes(tag)
                    ? `<span class="personality-tag">${tag}</span>`
                    : ''
                ).join('')}
            </div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                ${getMatchExplanation(event, matchScore)}
            </p>
        </div>
        ` : ''}

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

function getMatchExplanation(event, score) {
    if (!AppState.userProfile) return '';

    const explanations = [];

    // Personality match
    const personalityMatches = event.personalityTags.filter(tag =>
        AppState.userProfile.personalityTraits.includes(tag)
    );
    if (personalityMatches.length > 0) {
        explanations.push(`This event aligns with your ${personalityMatches.join(', ')} traits`);
    }

    // Vibe match
    const vibeMatches = event.vibes.filter(vibe =>
        AppState.userProfile.vibes.includes(vibe)
    );
    if (vibeMatches.length > 0) {
        explanations.push(`matches your preference for ${vibeMatches.slice(0, 2).join(' and ')} experiences`);
    }

    // Budget match
    if (event.priceCategory === AppState.userProfile.budget) {
        explanations.push(`fits your budget perfectly`);
    }

    return explanations.join(', and ') + '.';
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
            .filter(e => AppState.userProfile ? calculateEventScore(e) > 60 : true)
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
            .filter(e => AppState.userProfile ? calculateEventScore(e) > 70 : true)
            .sort((a, b) => calculateEventScore(b) - calculateEventScore(a))
            .slice(0, 2);

        differentCategory.forEach(event => {
            recommendations.push({
                event,
                reason: `Sometimes a change of pace is exactly what you need! This ${event.category} event offers a completely different vibe that matches your personality perfectly. 🔄`,
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

    const sentimentEmoji = sentiment.sentiment === 'positive' ? '😊' : sentiment.sentiment === 'negative' ? '😔' : '😐';
    const sentimentClass = sentiment.sentiment;

    container.innerHTML = `
        <div class="recommendations-header">
            <h3>Based on your review... ${sentimentEmoji}</h3>
            <span class="sentiment-badge ${sentimentClass}">
                ${sentimentEmoji} ${sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1)} Sentiment
            </span>
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
                            ${AppState.userProfile ? `<span class="badge">${calculateEventScore(rec.event)}% match</span>` : ''}
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

// Make functions globally accessible for onclick handlers
window.toggleSaveEvent = toggleSaveEvent;
window.showEventDetails = showEventDetails;
window.openReviewForm = openReviewForm;
window.viewRecommendedEvent = viewRecommendedEvent;
