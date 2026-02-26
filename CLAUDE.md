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
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Global styles (TailwindCSS)
│   ├── components/
│   │   ├── VideoPlayer.jsx      # YouTube video player modal
│   │   ├── ChannelManager.jsx   # Channel management UI (not rendered in App.jsx, API server required)
│   │   ├── PromptPanel.jsx      # Prompt panel component
│   │   ├── SlideExample.jsx     # Slide example component
│   │   ├── StyleThumbnail.jsx   # Style thumbnail component
│   │   └── ThumbnailSlide.jsx   # Thumbnail slide component
│   ├── data/
│   │   ├── categories.js        # CATEGORY_KEYWORDS object & CATEGORIES array (both exported)
│   │   ├── channels.json        # Tracked YouTube channels
│   │   └── videos.json          # Collected video data (auto-generated)
│   ├── utils/                   # Helper utilities
│   │   ├── api.js               # YouTube API integration
│   │   ├── fileUtils.js         # File I/O utilities
│   │   └── validation.js        # Input validation
│   └── config/                  # Configuration files
│       ├── constants.js         # App constants
│       └── env.js               # Environment validation
├── scripts/
│   ├── fetch_videos.js          # YouTube API video fetcher
│   └── manage_channels.js       # CLI channel manager
├── start.bat                    # Windows launcher with menu system (5 options)
├── auto_update_scheduled.bat    # Scheduled auto-update (fetch + deploy)
├── setup_scheduler.bat          # Windows Task Scheduler registration
└── uninstall_scheduler.bat      # Scheduler removal
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
# YouTube API (Required)
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# Server Configuration (Optional)
PORT=3002
VITE_PORT=5176
VITE_API_URL=http://localhost:3002

# CORS (Optional, comma-separated)
ALLOWED_ORIGINS=http://localhost:5176,http://localhost:5173

# Debug (Optional)
DEBUG=false
NODE_ENV=development
```

See `.env.example` for a complete template. The YouTube API key is used by both Vite (frontend) and Node scripts (backend).

### Auto-Update System

Windows Task Scheduler runs `auto_update_scheduled.bat` periodically:
1. Fetches last 30 days of videos
2. Checks for changes in `src/data/` files
3. Auto-commits and pushes to GitHub if changes detected
4. Vercel auto-deploys on push

### Production Data Updates

Frontend reads `videos.json` as a static import, requiring rebuild for updates. There are three methods to update production data:

**Method 1: Manual Update**
```bash
node scripts/fetch_videos.js 30
git add src/data/videos.json
git commit -m "Update videos"
git push
```

**Method 2: UI Deployment (Requires server)**
1. Start server: `node server.js`
2. Open Channel Manager UI
3. Click "배포하기 (GitHub)" button
4. Server fetches → commits → pushes automatically

**Method 3: Scheduled Automation**
- Windows Task Scheduler runs `auto_update_scheduled.bat`
- Executes automatically at configured intervals

After any push to GitHub, Vercel automatically rebuilds and deploys the frontend with updated data.

## Key Design Patterns

### Video Filtering in App.jsx
- Uses `useMemo` for filtered results (performance optimization)
- Helper function `getVideoCategories()` for backward compatibility
- Multi-category support: each video can belong to multiple categories
- Backward compatible: falls back to old `category` field if `categories` array missing
- Search queries check title, channel name, AND categories

### Infinite Scroll
- Initial load: 24 videos
- Uses Intersection Observer to detect scroll bottom
- Loads +24 videos per trigger
- Resets to 24 when filters/search changes

### Git Automation in server.js `/api/deploy`
- Only stages specific files: `src/data/videos.json` and `src/data/channels.json`
- Only commits if actual changes exist in those data files
- Uses `execFile` for shell injection prevention, `execSync` with validated inputs for git commands
- Large buffer (50MB) to handle big git outputs
- Continues deployment even if fetch fails (quota limits)
- Returns detailed deployment log to frontend
- Input validation via `validateDays()` prevents command injection

**Batch files (`start.bat` options 2/4, `auto_update_scheduled.bat`):**
- Uses `git add .` which stages ALL changed files (not just data files)
- `.gitignore` protects `.env`, `node_modules/`, `dist/`, `.claude/` from being committed
- Any other modified files (code, config, docs) WILL be included in the commit

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
- `ChannelManager.jsx` exists as a standalone component but is NOT currently rendered in `App.jsx`; channel management is done via CLI (`node scripts/manage_channels.js`) or API endpoints
- `/api/deploy` only stages data files; batch files use `git add .` to stage all changes (protected by `.gitignore`)
