<div align="center">

# 🔍 Scraper

**A high-performance REST API that extracts brand identity elements from any website using Playwright and TypeScript.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature                   | Description                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| 🖼️ **Logo Discovery**     | Multi-strategy heuristics — meta tags, common selectors, SVG detection, favicon fallback |
| 💬 **Tagline Extraction** | Pulls primary `<h1>` heading or Open Graph title                                         |
| 📝 **Description**        | Extracts meta descriptions and summary text                                              |
| 🎨 **Color Palette**      | Analyzes computed styles to identify up to 5 brand colors                                |
| 🔤 **Typography**         | Detects font families used across headings and body text                                 |
| 📸 **Screenshot**         | Captures a viewport screenshot (1280×800) in base64 PNG format                           |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/brand-identity-scraper.git
cd brand-identity-scraper

# Install dependencies (Chromium installs automatically via postinstall)
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com
```

### Running the Service

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The API will be available at `http://localhost:3001`.

---

## 📖 API Reference

### `GET /health` — Health Check

```json
{
  "status": "ok",
  "service": "brand-scraper-service",
  "timestamp": "2025-12-26T13:33:21.000Z"
}
```

### `POST /api/scrape` — Scrape Brand Identity

**Request:**

```json
{
  "url": "https://example.com"
}
```

**Success Response (`200`):**

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

**Error Response (`500`):**

```json
{
  "error": "Scraping failed",
  "message": "Navigation timeout exceeded",
  "url": "https://example.com"
}
```

---

## 🐳 Docker

```bash
# Build the image
docker build -t brand-scraper .

# Run the container
docker run -p 3001:3001 --env-file .env brand-scraper
```

---

## ⚙️ Configuration

| Variable          | Default       | Description                            |
| ----------------- | ------------- | -------------------------------------- |
| `PORT`            | `3001`        | Server port                            |
| `NODE_ENV`        | `development` | Environment mode                       |
| `ALLOWED_ORIGINS` | `*`           | CORS allowed origins (comma-separated) |

---

## 🏗️ Architecture

### Scraping Pipeline

```
Request → URL Validation → Playwright Browser Launch → Page Navigation
  → Parallel Data Extraction (Logo · Colors · Fonts · Text) → Screenshot Capture
  → JSON Response
```

### Extraction Strategies

<details>
<summary><b>Logo Discovery</b> (6-step priority chain)</summary>

1. Apple Touch Icon / Precomposed Icon
2. Standard Favicon (`link[rel*="icon"]`)
3. Logo-labeled elements inside `<header>` / `<nav>`
4. First `<img>` or `<svg>` in header/nav
5. Global logo-labeled elements (`img[class*="logo"]`, etc.)
6. Open Graph image (last resort)

</details>

<details>
<summary><b>Color Extraction</b></summary>

- Analyzes computed styles from key elements (`h1-h3`, `p`, `button`, `a`, `nav`, `header`)
- Filters generic colors (white, black, transparent)
- Converts RGB/RGBA → HEX
- Returns top 5 unique colors

</details>

<details>
<summary><b>Font Detection</b></summary>

- Queries computed `font-family` from typography elements
- Extracts primary font from each font stack
- Deduplicates results

</details>

### Browser Configuration

| Setting       | Value                      |
| ------------- | -------------------------- |
| Engine        | Chromium (via Playwright)  |
| Mode          | Headless                   |
| Viewport      | 1280 × 800                 |
| Wait Strategy | Network idle, 45 s timeout |
| User Agent    | Chrome 119 on Windows      |

---

## 🔒 Security

- **CORS** — Configurable allowed origins
- **Body Size Limit** — 10 MB max request body
- **URL Validation** — Strict URL format checking before scraping
- **Graceful Error Handling** — No stack traces or internals leaked to clients
- **Stateless** — No data persistence; each request is isolated

---

## 🛠️ Troubleshooting

<details>
<summary>Playwright / Chromium won't install</summary>

```bash
npx playwright install chromium
```

</details>

<details>
<summary>Out-of-memory errors on large sites</summary>

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/amazing-feature`
3. Commit your changes — `git commit -m "feat: add amazing feature"`
4. Push to the branch — `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
