import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeBrandIdentity } from './scraper';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['POST', 'GET'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'brand-scraper-service',
        timestamp: new Date().toISOString()
    });
});

// Main scraping endpoint
app.post('/api/scrape', async (req: Request, res: Response) => {
    const { url } = req.body;

    // Validation
    if (!url) {
        return res.status(400).json({
            error: 'URL is required',
            message: 'Please provide a valid URL in the request body'
        });
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid URL format',
            message: 'The provided URL is not valid'
        });
    }

    console.log(`[${new Date().toISOString()}] Scraping request for: ${url}`);

    try {
        const startTime = Date.now();
        const brandData = await scrapeBrandIdentity(url);
        const duration = Date.now() - startTime;

        console.log(`[${new Date().toISOString()}] Scraping completed in ${duration}ms`);

        res.json({
            success: true,
            data: brandData,
            meta: {
                scrapedAt: new Date().toISOString(),
                duration: `${duration}ms`
            }
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Scraping failed:`, error);

        res.status(500).json({
            error: 'Scraping failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            url: url
        });
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist'
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Brand Scraper Service                 ║
║  Status: Running                       ║
║  Port: ${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}      ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});