# Central Florida Events - Personality-Based Event Recommender

A sophisticated web application that recommends Central Florida events based on Myers-Briggs inspired personality assessments, with intelligent review analysis and contextual recommendations.

## Features

### 8-Step Onboarding Flow
- **Personality Assessment**: Myers-Briggs inspired questions to determine your personality type (MBTI-style)
- **Preference Collection**: Event vibe preferences, budget constraints, group size, and time preferences
- **Beautiful UI**: Smooth transitions and engaging card-based selection interface

### Intelligent Recommendation Engine
- **Weighted Algorithm**: Scores events based on:
  - Personality trait matching (40% weight)
  - Vibe preferences (30% weight)
  - Budget compatibility (15% weight)
  - Group size preferences (10% weight)
  - Time preferences (5% weight)
- **Dynamic Scoring**: Each event receives a personalized match percentage
- **Match Explanations**: Detailed reasoning for why events match your profile

### Event Discovery
- **Multi-Column Grid Layout**: Desktop-optimized card display
- **Search Functionality**: Real-time event search across names, descriptions, and tags
- **Advanced Filtering**: Filter by category and sort by match score, date, or price
- **30 Curated Events**: Diverse selection of Central Florida events across multiple categories

### Review System with Sentiment Analysis
- **5-Star Rating**: Simple and intuitive rating system
- **Text Reviews**: Share detailed experiences
- **Sentiment Analysis**: Automatically analyzes review sentiment (positive, negative, neutral)
- **Concern Detection**: Identifies specific complaints:
  - Price concerns → Budget-friendly alternatives
  - Crowd issues → Intimate venue suggestions
  - Boring feedback → Interactive event recommendations

### Contextual Recommendations
- **Smart Suggestions**: AI-powered recommendations based on review feedback
- **Concern Badges**: Visual indicators showing what concern each recommendation addresses
- **Detailed Reasoning**: Clear explanations with emoji indicators for why events are suggested
- **Multiple Strategies**:
  - Similar events for positive reviews
  - Budget alternatives for price complaints
  - Intimate venues for crowd concerns
  - Interactive events for boring experiences
  - Fresh perspectives for general dissatisfaction

### State Management
- **localStorage Persistence**: Your profile, saved events, and reviews persist across sessions
- **Saved Events**: Bookmark favorite events for quick access
- **Review History**: Track all your past reviews

### Desktop-Optimized Design
- **Sidebar Navigation**: Clean, always-visible navigation panel
- **Multi-Column Layouts**: Efficient use of screen real estate
- **Hover States**: Interactive feedback for better UX
- **Smooth Transitions**: CSS animations throughout the app
- **Modal Overlays**: Detailed event views and review forms

## Technology Stack

- **HTML5**: Semantic markup with accessibility in mind
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: No frameworks - pure, efficient JavaScript
- **localStorage API**: Client-side data persistence

## Project Structure

```
Central-Florida-Events/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and animations
├── app.js             # Application logic and functionality
├── events-data.js     # Event dataset with 30+ events
└── README.md          # Project documentation
```

## Event Data Structure

Each event includes:
- **Basic Info**: Name, description, location, date, time, price
- **Personality Tags**: MBTI trait associations (E/I, S/N, T/F, J/P)
- **Vibes**: Atmosphere tags (energetic, relaxed, creative, etc.)
- **Metadata**: Category, capacity, interactivity level, duration, venue type
- **Practical Details**: Group size compatibility, time of day

## Recommendation Algorithm

The scoring system uses a weighted approach:

```javascript
Score = (Personality Match × 40%) +
        (Vibe Match × 30%) +
        (Budget Match × 15%) +
        (Group Size Match × 10%) +
        (Time Match × 5%)
```

## Sentiment Analysis

The review system analyzes text for:
- **Positive Keywords**: great, amazing, wonderful, loved, etc.
- **Negative Keywords**: bad, terrible, disappointing, boring, etc.
- **Specific Concerns**:
  - Price: expensive, overpriced, costly
  - Crowds: crowded, packed, too many people
  - Engagement: boring, dull, uninteresting

## GitHub Pages Deployment

This app is optimized for GitHub Pages deployment:

1. **No Build Process Required**: Pure HTML/CSS/JS - works immediately
2. **Relative Paths**: All resources use relative paths
3. **Client-Side Only**: No server-side dependencies
4. **Single Page Application**: All functionality in one page

### Deployment Steps

1. Push to GitHub repository
2. Go to repository Settings → Pages
3. Select branch (main/master) and root directory
4. Save and wait for deployment
5. Access at: `https://[username].github.io/Central-Florida-Events/`

## Usage Guide

### First Time Setup
1. Click "Get Started" to begin onboarding
2. Complete all 8 steps of personality assessment
3. Your profile is automatically saved to localStorage

### Discovering Events
1. Browse the "Explore" tab to see all events
2. Events are sorted by match percentage by default
3. Use search to find specific types of events
4. Filter by category or change sort order
5. Click any event card to view full details

### Saving Events
1. Click the heart icon on any event card
2. Access saved events in the "Saved" tab
3. Click again to unsave

### Writing Reviews
1. Open any event and click "Write Review"
2. Select your star rating (1-5 stars)
3. Write your experience (minimum 10 characters)
4. Click "Submit Review"
5. Receive personalized recommendations based on your feedback

### Understanding Recommendations
- **Budget Badge**: Event is budget-friendly (addresses price concerns)
- **Intimate Badge**: Small capacity event (addresses crowd concerns)
- **Interactive Badge**: High engagement event (addresses boring feedback)
- **Match Percentage**: Shows compatibility with your personality

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires JavaScript enabled and localStorage support.

## Features Breakdown

### Onboarding
- Step 1: Welcome screen with feature overview
- Step 2: Energy source (Extraverted vs Introverted)
- Step 3: Information processing (Sensing vs Intuitive)
- Step 4: Decision making (Thinking vs Feeling)
- Step 5: Lifestyle approach (Judging vs Perceiving)
- Step 6: Event vibe preferences (multiple selection)
- Step 7: Budget category selection
- Step 8: Group size and time preferences

### Event Categories
- Music (concerts, festivals, jazz nights)
- Food & Drink (food trucks, cooking classes, wine tasting)
- Sports (basketball games, 5K runs, mountain biking)
- Arts & Culture (galleries, theater, photography)
- Outdoor (kayaking, hot air balloons, nature tours)
- Education (workshops, stargazing, tech events)
- Community (farmers markets, board games, trivia)

## Customization

### Adding New Events
Edit `events-data.js` and add events following this structure:

```javascript
{
    id: 31, // Unique ID
    name: "Event Name",
    category: "music", // music, food, sports, arts, outdoor, education, community
    description: "Event description",
    location: "Venue name, City",
    date: "2025-11-15",
    time: "evening", // morning, afternoon, evening, night
    price: 25, // 0 for free events
    priceCategory: "moderate", // free, budget, moderate, premium
    capacity: "large", // small, medium, large
    image: "🎵", // Emoji icon
    personalityTags: ["E", "N", "F", "P"], // MBTI traits
    vibes: ["energetic", "social"], // Event atmospheres
    groupSizes: ["couple", "small"], // solo, couple, small, large
    interactivity: "high", // low, medium, high
    venue: "indoor", // indoor, outdoor
    duration: "3 hours",
    tags: ["music", "concert", "live"]
}
```

### Styling
All colors and design tokens are defined as CSS custom properties in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #ec4899;
    /* Modify these to change the theme */
}
```

## Performance

- **Fast Load**: No external dependencies or frameworks
- **Efficient Rendering**: Smart DOM updates only when needed
- **Optimized Search**: Debounced search for smooth performance
- **Minimal Bundle**: ~50KB total (HTML + CSS + JS)

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast color scheme
- Readable font sizes

## Future Enhancement Ideas

- Multiple event images
- Map integration for event locations
- Calendar sync functionality
- Social sharing features
- User accounts with cloud sync
- Event reminders/notifications
- Advanced filtering (date ranges, distance)
- Event organizer submissions
- Rating aggregation and reviews from multiple users

## License

This project is open source and available for educational and personal use.

## Credits

Built for Central Florida event discovery with ❤️

---

**Live Demo**: Deploy to GitHub Pages to see it in action!
