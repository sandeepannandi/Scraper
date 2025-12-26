# Brand Identity Scraper Service

A high-performance REST API service built with **Playwright** and **TypeScript** that extracts brand identity elements from any website.

## Features

Extracts the following brand assets from any URL:

- **Logo** - Discovers brand logos using multi-strategy heuristics (meta tags, common selectors, SVG detection)
- **Tagline** - Extracts primary heading or Open Graph title
- **Description** - Pulls meta descriptions and summary text
- **Color Palette** - Analyzes computed styles to extract brand colors (up to 8 colors)
- **Typography** - Detects fonts used across headings and body text (up to 4 fonts)
- **Screenshot** - Captures viewport screenshot in base64 PNG format

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Playwright will auto-install Chromium browser
```

### Configuration

Create a `.env` file in the root directory:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com
```

### Running the Service

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The service will start on `http://localhost:3001` (or your configured PORT).

## API Reference

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "brand-scraper-service",
  "timestamp": "2025-12-26T13:33:21.000Z"
}
```

### Scrape Brand Identity

```http
POST /api/scrape
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "logo": "https://example.com/logo.png",
    "tagline": "Example Domain",
    "description": "This domain is for use in illustrative examples...",
    "colors": ["#1A73E8", "#34A853", "#FBBC04", "#EA4335"],
    "fonts": ["Roboto", "Arial", "Helvetica"],
    "screenshot": "data:image/png;base64,iVBORw0KG..."
  },
  "meta": {
    "scrapedAt": "2025-12-26T13:33:21.000Z",
    "duration": "3247ms"
  }
}
```

**Error Response:**
```json
{
  "error": "Scraping failed",
  "message": "Navigation timeout exceeded",
  "url": "https://example.com"
}
```

## ⚡ Performance

- **Average scrape time:** 2-5 seconds for simple sites
- **Complex sites:** 5-8 seconds
- **Optimizations:**
  - Headless browser mode
  - Network idle detection
  - Parallel extraction using `page.evaluate()`
  - Viewport-only screenshots

## 🛠️ Technical Details

### Scraping Strategy

1. **Logo Discovery** (Multi-priority):
   - Apple Touch Icon
   - Open Graph image
   - Common CSS selectors (`img[class*="logo"]`, etc.)
   - SVG detection
   - Favicon fallback

2. **Color Extraction**:
   - Analyzes computed styles from key elements
   - Filters out generic colors (white, black, transparent)
   - Converts RGB/RGBA to HEX format
   - Returns top 8 unique colors

3. **Font Detection**:
   - Queries computed `font-family` from typography elements
   - Extracts primary font from font stack
   - Deduplicates and returns top 4 fonts

4. **Screenshot**:
   - Viewport-only capture (1280x800)
   - PNG format, base64 encoded
   - Optimized for speed

### Browser Configuration

- **Engine:** Chromium (via Playwright)
- **Mode:** Headless
- **Viewport:** 1280x800
- **Wait Strategy:** Network idle with 45s timeout
- **User Agent:** Modern Chrome on Windows

## Security

- CORS protection with configurable origins
- Request body size limit (10MB)
- URL validation before scraping
- Graceful error handling
- No data persistence

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |

## Troubleshooting

### Playwright Installation Issues

If Chromium doesn't install automatically:

```bash
npx playwright install chromium
```

### Memory Issues

For large-scale scraping, increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
