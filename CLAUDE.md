# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trending AI Insights** is a YouTube video aggregator that tracks and categorizes AI-related content from curated channels. It consists of a React frontend, Express backend, and automated data collection system that fetches videos via YouTube API and deploys updates to GitHub.

## Development Commands

### Starting the Application
```bash
# Interactive launcher (Windows)
start.bat

# Manual start (two separate terminals)
node server.js              # API server on port 3002
npm run dev                 # Vite dev server on port 5176

# Build for production
npm run build
npm run preview
```

### Data Management
```bash
# Fetch videos from tracked channels
node scripts/fetch_videos.js [days]          # Default: 7 days

# Manage channels (add/remove)
node scripts/manage_channels.js

# Scheduled auto-update (30 days + auto-deploy)
auto_update_scheduled.bat
```

### Linting
```bash
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Lucide React icons
- **Backend**: Express server with CORS and body-parser
- **Data**: JSON files in `src/data/` (channels.json, videos.json, categories.js)
- **API**: YouTube Data API v3
- **Deployment**: Vercel (frontend) + GitHub (data storage)

### Project Structure
```
├── server.js                    # Express API server (port 3002)
├── src/
│   ├── App.jsx                  # Main React app with filtering and infinite scroll
│   ├── components/              # React components
│   │   ├── VideoPlayer.jsx      # YouTube video player modal
│   │   ├── ChannelManager.jsx   # Channel management UI
│   │   └── ...                  # Other UI components
│   ├── data/
│   │   ├── categories.js        # CATEGORY_KEYWORDS mapping (exported const)
│   │   ├── channels.json        # Tracked YouTube channels
│   │   └── videos.json          # Collected video data (auto-generated)
│   └── utils/                   # Helper utilities
├── scripts/
│   ├── fetch_videos.js          # YouTube API video fetcher
│   └── manage_channels.js       # CLI channel manager
└── start.bat                    # Windows launcher with menu system
```

### Data Flow

1. **Channel Management**: Users add channels via URL/handle → YouTube API lookup → Store in `channels.json`
2. **Video Collection**: Scheduled/manual fetch → YouTube PlaylistItems API → Category matching → Store in `videos.json`
3. **Deployment**: Fetch → Git commit → Git push → Vercel auto-deploy
4. **Frontend Display**: Read `videos.json` → Filter by category/search → Infinite scroll rendering

### Category System

Categories are defined in `src/data/categories.js` as `CATEGORY_KEYWORDS` object. Each category has keyword arrays (supports Korean and English). Videos are auto-categorized during fetch based on title matching with these keywords.

**Important**: The category matching uses:
- Word boundary regex (`\b`) for short English words to avoid false matches (e.g., "Flow" vs "TensorFlow")
- Simple includes for Korean or multi-word keywords
- Videos can have multiple categories (stored in `categories` array field)

### YouTube API Optimization

The fetcher uses **PlaylistItems API** instead of Search API to save quota:
- Search API: ~100 quota per channel
- PlaylistItems API: 2 quota per channel (1 for channel lookup + 1 for playlist items)

Process: Get channel → Get uploads playlist ID → Fetch playlist items → Filter by date

### API Endpoints (Express Server)

- `GET /api/channels` - List all tracked channels
- `POST /api/channels` - Add new channel by URL/handle
- `DELETE /api/channels/:id` - Remove channel
- `POST /api/fetch` - Trigger video fetch (body: `{days: 7}`)
- `POST /api/deploy` - Fetch + commit + push workflow (body: `{days: 7}`)

### Environment Variables

Required in `.env`:
```
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

Used by both Vite (frontend) and Node scripts (backend).

### Auto-Update System

Windows Task Scheduler runs `auto_update_scheduled.bat` periodically:
1. Fetches last 30 days of videos
2. Checks for changes in `src/data/` files
3. Auto-commits and pushes to GitHub if changes detected
4. Vercel auto-deploys on push

## Key Design Patterns

### Video Filtering in App.jsx
- Uses `useMemo` for performance optimization
- Multi-category support: each video can belong to multiple categories
- Backward compatible: falls back to old `category` field if `categories` array missing
- Search queries check title, channel name, AND categories

### Infinite Scroll
- Initial load: 24 videos
- Uses Intersection Observer to detect scroll bottom
- Loads +24 videos per trigger
- Resets to 24 when filters/search changes

### Git Automation in server.js `/api/deploy`
- Only commits if actual changes exist in `videos.json` or `channels.json`
- Uses `execSync` with large buffer (50MB) to handle big outputs
- Continues deployment even if fetch fails (quota limits)
- Returns detailed deployment log to frontend

## Common Development Patterns

### Adding a New Category
1. Add to `CATEGORY_KEYWORDS` in `src/data/categories.js`
2. Export is automatic via `Object.keys(CATEGORY_KEYWORDS)`
3. Next fetch will auto-categorize existing/new videos

### Modifying Video Fetch Logic
- Edit `scripts/fetch_videos.js`
- Key function: `determineCategories(title, description)` - only checks title currently
- Videos with zero matching categories are filtered out

### Testing YouTube API Calls
- Check quota usage at: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
- Daily quota limit: 10,000 units
- For testing, reduce channel count or use shorter time ranges

## Notes

- The frontend reads `videos.json` as a static import, so data updates require rebuild or page refresh
- Scheduled tasks use Windows Task Scheduler (Windows-only automation)
- The server has a mock fallback for 403 errors during development (creates mock channel)
- Git operations in `/api/deploy` only stage specific files to avoid committing unrelated changes
