# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurora is a weather visualization application that displays NOAA OVATION aurora forecast data. It provides two implementations:
1. **Python backend** (`aurora_animation.py`) - Downloads NOAA aurora forecast frames and creates GIF/WebP animations
2. **Web frontend** (`index.html`, `aurora_viewer.jsx`) - Interactive React component and vanilla JavaScript viewer for real-time aurora visualization

The application fetches 24-hour aurora forecast data from NOAA's Space Weather Prediction Center API and presents it as an animated visualization with playback controls.

## Architecture

### Data Flow
- NOAA API (`https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json`) provides frame metadata with timestamps and image URLs
- Each frame is a GeoTIFF image hosted on the same NOAA service
- Frontend fetches the JSON once on load, then streams frame images as needed
- Python script downloads all frames upfront and generates a compressed animation file

### Frontend Implementation

**HTML/Vanilla JS (`index.html`)**
- Standalone, deployable version without build tools
- Preloads first 5 frames for faster initial display
- Background preloads remaining frames after initial render
- ~400 lines of vanilla JavaScript with embedded CSS

**React Component (`aurora_viewer.jsx`)**
- Modern React component using hooks (useState, useEffect, useRef, useCallback)
- Uses Lucide React for icons (Play, Pause, SkipBack, SkipForward, Loader2)
- Tailwind CSS for styling (dark theme with cyan/slate colors)
- Lazy loads images - only fetches when needed for current frame

**Shared Concerns**
- Both implementations manage identical state: frame array, current frame index, playback status, speed (fps)
- Animation loop uses `setInterval` with dynamic duration based on FPS setting (1000/fps)
- Circular frame navigation with modulo operator
- Keyboard controls: Space (play/pause), Arrow keys (prev/next)
- Progress bar click-to-seek support

### Python Backend

**`aurora_animation.py`** generates static animations:
- Fetches JSON frame metadata from NOAA
- Downloads full-resolution images sequentially with progress feedback
- Supports frame limiting with `--limit` flag
- Generates GIF (with optimization) or WebP (with quality tuning)
- Includes error handling for failed image downloads with graceful continuation
- Command-line interface with options: `--output`, `--fps`, `--limit`

## Commands

### Python Animation Generator
```bash
# Generate default animation (10 fps, all frames)
python aurora_animation.py

# Generate with custom output and frame rate
python aurora_animation.py --output aurora.gif --fps 15

# Limit to first N frames for faster generation
python aurora_animation.py --limit 50

# Generate WebP format instead of GIF
python aurora_animation.py --output aurora.webp --fps 8

# View help
python aurora_animation.py --help
```

### Development Commands

**Python dependencies** (auto-installs on first run):
- `requests` - HTTP client for fetching NOAA data
- `Pillow` - Image processing library (auto-installed with `--break-system-packages` if needed)

**No build step required** for the HTML/vanilla JS version - open `index.html` directly in a browser.

**React version** requires a build tool (not included in repo). To use:
1. Copy `aurora_viewer.jsx` into a React project with Tailwind and Lucide installed
2. Import as a component: `import AuroraViewer from './aurora_viewer.jsx'`

## Key Implementation Details

### Image Preloading Strategy
Both frontends use preloading to improve perceived performance:
- **Vanilla JS**: Preloads first 5 frames blocking, then remainder in background
- **React**: Lazy-loads individual frames on demand, showing spinner during load

### API Rate Limiting Considerations
NOAA's API does not appear to have strict rate limiting, but concurrent requests should be kept reasonable. Current implementations fetch serially to avoid overwhelming the service.

### State Management Pattern
- **Vanilla JS**: Direct DOM manipulation with global variables
- **React**: React hooks with event handlers updating state, triggers re-renders

### Animation Loop Precision
Both use `setInterval` for animation. FPS calculation: `interval = 1000 / fps`. At 10fps (default), interval = 100ms. Users can adjust to 1-20 fps via slider.

### Time Display
Timestamps from NOAA are ISO 8601 format in UTC. Both implementations parse with `new Date()` and convert to Europe/Warsaw timezone (CET/CEST) for display using `toLocaleString()` with `timeZone: 'Europe/Warsaw'`.

## Common Issues & Solutions

**Issue: "Failed to load aurora data" error**
- NOAA service is temporarily unavailable - try refreshing the page after a minute

**Issue: Slow initial load**
- NOAA API response time varies. First load may take 5-10 seconds depending on network and service load

**Issue: Animation stutters or frames skip**
- Browser is CPU-constrained. Reduce FPS slider or close other tabs
- Frame images are large (typically 600KB+); ensure sufficient bandwidth

**Issue: Python script hangs on image download**
- NOAA service may be slow. The script shows progress as "Downloading frame X/Y". May take 5-10 minutes for full dataset

## Data Source & Attribution

All aurora data comes from NOAA Space Weather Prediction Center:
- **JSON frames**: `https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json`
- **Image data**: Individual GeoTIFF files hosted at `https://services.swpc.noaa.gov/...`
- **Model**: OVATION (Oval Variation, Assessment, Tracking on Intensity, Empirical, and Numerical)
- **Coverage**: Northern Hemisphere aurora forecast
- **Update frequency**: Every 5 minutes
- **Data retention**: 24-hour rolling window

## Testing

No automated tests currently exist. Manual testing checklist:
- Load page/app and verify data fetches without errors
- Play/pause animation works smoothly
- Speed slider changes playback rate
- Keyboard controls (Space, Arrow keys) work
- Progress bar click-to-seek works
- Animation handles frame wraparound correctly (loops)
- Previous/Next frame buttons work when paused
- Frame counter updates correctly
- Python animation generation completes without errors
