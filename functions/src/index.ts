import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';

const PUPPETEER_OPTIONS = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
    "--window-size=1920x1080",
];
// Sets https prefix to url
const setUrlLink = (url: string): string => {
    return url.indexOf('://') === -1 ? 'https://' + url : url;
}
// Validate url
const isValidUrl = (str: string): boolean => {
    try {
        new URL(str)
        return true
    } catch (e) {
        return false
    }
}
/**
* Screenshot caputre function
* Example http://localhost:5001/screensnap-d1580/us-central1/screensnap?url=google.lv&full=false&width=500&height=500
*/
export const screensnap = functions
    .runWith({ memory: '1GB', timeoutSeconds: 60 })
    .https.onRequest((request, response) => {
        (async () => {
            const url = setUrlLink(request.query.url as string);
            if (!isValidUrl(url)) {
                return response.send(`Invalid url: ${url}`);
            }

            const width = parseInt(request.query.width as string) || 1024;
            const height = parseInt(request.query.height as string) || 768;
            const fullPage = request.query.full
                ? request.query.full === "true"
                : false;

            const browser = await puppeteer.launch({ args: PUPPETEER_OPTIONS });

            const page = await browser.newPage();

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 3000000 });

            if (!fullPage) {
                await page.setViewport({ width, height });
            }

            const screenshot = await page.screenshot({ fullPage });

            await browser.close();

            return response.type("image/png").send(screenshot);
        })().catch(() => response.status(500).send({ error: 'Something failed!' }));
    });
