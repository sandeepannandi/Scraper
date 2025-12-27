import { chromium, Browser } from 'playwright';

export interface BrandIdentity {
    title: string;
    logo: string | null;
    tagline: string;
    description: string;
    colors: string[];
    fonts: string[];
    screenshot: string;
}

/**
 * Scrapes brand identity data from a given URL using 
 * computed styles and heuristic-based discovery.
 */
export async function scrapeBrandIdentity(url: string): Promise<BrandIdentity> {
    let browser: Browser | null = null;

    try {
        // Launch browser with optimized settings
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1
        });

        const page = await context.newPage();

        // Navigate with timeout and wait for network to settle
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 45000
        });

        // Wait a bit for any lazy-loaded content
        await page.waitForTimeout(1500);

        // Extract brand identity data
        const identity = await page.evaluate(() => {
            // Helper: Convert RGB/RGBA to Hex
            const rgbToHex = (rgb: string): string => {
                const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
                if (!match) return rgb;

                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');

                return `#${r}${g}${b}`.toUpperCase();
            };

            // Helper: Check if color is too common/generic
            const isGenericColor = (hex: string): boolean => {
                const generic = ['#FFFFFF', '#000000', '#00000000', 'rgba(0, 0, 0, 0)', 'transparent'];
                return generic.includes(hex) || hex.includes('rgba(0, 0, 0, 0)');
            };

            // 1. EXTRACT COLORS (Computed Styles)
            const colorSet = new Set<string>();
            const elements = document.querySelectorAll('h1, h2, h3, p, button, a, nav, header, [class*="hero"], [class*="banner"]');

            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const bg = rgbToHex(style.backgroundColor);
                const fg = rgbToHex(style.color);
                const border = rgbToHex(style.borderColor);

                if (!isGenericColor(bg)) colorSet.add(bg);
                if (!isGenericColor(fg)) colorSet.add(fg);
                if (!isGenericColor(border) && border !== 'rgb(0, 0, 0)') colorSet.add(border);
            });

            // 2. EXTRACT FONTS
            const fontSet = new Set<string>();
            const typographyElements = document.querySelectorAll('h1, h2, h3, body, p');

            typographyElements.forEach(el => {
                const family = window.getComputedStyle(el).fontFamily;
                // Get the first font in the stack and clean it
                const primaryFont = family.split(',')[0].replace(/['"]/g, '').trim();
                if (primaryFont && !primaryFont.includes('system-ui')) {
                    fontSet.add(primaryFont);
                }
            });

            // 3. LOGO DISCOVERY (Multi-strategy heuristics)
            const findLogo = (): string | null => {
                // Priority 1: Apple Touch Icon (usually high quality)
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) {
                    const href = appleIcon.getAttribute('href');
                    if (href) return new URL(href, window.location.href).href;
                }

                // Priority 2: Open Graph Image
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage) {
                    const content = ogImage.getAttribute('content');
                    if (content) return new URL(content, window.location.href).href;
                }

                // Priority 3: Common logo selectors
                const logoSelectors = [
                    'img[class*="logo" i]',
                    'img[id*="logo" i]',
                    'img[alt*="logo" i]',
                    'img[src*="logo" i]',
                    'svg[class*="logo" i]',
                    'a[class*="brand" i] img',
                    'header img:first-of-type',
                    'nav img:first-of-type'
                ];

                for (const selector of logoSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (element.tagName === 'IMG') {
                            const src = (element as any).src;
                            if (src && !src.includes('data:image')) return src;
                        } else if (element.tagName === 'SVG') {
                            return element.outerHTML;
                        }
                    }
                }

                // Priority 4: Favicon fallback
                const favicon = document.querySelector('link[rel*="icon"]');
                if (favicon) {
                    const href = favicon.getAttribute('href');
                    if (href) return new URL(href, window.location.href).href;
                }

                return null;
            };

            // 4. TAGLINE & DESCRIPTION EXTRACTION
            const h1Element = document.querySelector('h1');
            const h1Text = h1Element?.innerText?.trim() || '';

            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';

            // Determine best tagline (prefer H1, fallback to OG title)
            const tagline = h1Text || ogTitle || metaDesc.substring(0, 100) || 'No tagline found';

            // Determine best description
            const description = metaDesc || ogDesc || h1Text || 'No description found';

            return {
                title: document.title || 'Untitled',
                logo: findLogo(),
                tagline: tagline,
                description: description,
                colors: Array.from(colorSet).slice(0, 4), // Top 4 colors
                fonts: Array.from(fontSet).slice(0, 3),   // Top 3 fonts
            };
        });

        // 5. CAPTURE SCREENSHOT
        const screenshotBuffer = await page.screenshot({
            fullPage: false,
            type: 'png'
        });
        const screenshotBase64 = screenshotBuffer.toString('base64');

        await browser.close();

        return {
            ...identity,
            screenshot: `data:image/png;base64,${screenshotBase64}`
        };

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error(`Scraping failed for ${url}:`, error);
        throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}