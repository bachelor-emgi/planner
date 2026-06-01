const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 4008;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-pdf', async (req, res) => {
    const config = req.body;
    let browser;

    try {
        console.log('Spúšťam generovanie PDF...');

        // Stabilné spustenie v Dockeri
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Nastavenie timeoutov
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        // Nastavenie viewportu na A4 veľkosť (presne)
        const isLandscape = config.orientation === 'landscape';
        const viewportWidth = isLandscape ? 1122 : 794;  // A4 v pixeloch na 96 DPI
        const viewportHeight = isLandscape ? 794 : 1122;

        await page.setViewport({
            width: viewportWidth,
            height: viewportHeight,
            deviceScaleFactor: 1
        });

        await page.goto(`http://127.0.0.1:${PORT}/?render=true`, { waitUntil: 'domcontentloaded' });

        await page.evaluate((cfg) => {
            window.renderForPdf(cfg);
        }, config);

        // Čakáme, kým React dovykreslí stránku
        await page.waitForSelector('#render-complete', { timeout: 60000 });

        // Daj Reactu čas na konečné renderovanie
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

        // Vygeneruj PDF s explicitným formátom a orientáciou
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: isLandscape,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true,  // Respect @page size from CSS
            displayHeaderFooter: false
        });

        console.log('PDF vygenerované. Odosielam.');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Planner.pdf"');
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Kritická chyba pri PDF:', error);
        res.status(500).send('Nastala chyba pri generovaní PDF.');
    } finally {
        if (browser) {
            await browser.close().catch(e => console.error("Chyba pri zatváraní prehliadača:", e));
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planner OS beží na porte ${PORT}`);
});
