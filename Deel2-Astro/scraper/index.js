const url = 'https://store.steampowered.com/search?filter=topsellers';
import puppeteer from 'puppeteer';
import fs from 'fs';

// Scrape Playstations
async function scrapeSteamDeals() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle0' });

    /* Optionally, load all games by scrolling the page */

    // Scroll the page to load all games
    // let previousHeight;
    // let currentHeight = 0;
    // while (previousHeight !== currentHeight) {
    //     console.log('Scrolling...', previousHeight, currentHeight);
    //   previousHeight = currentHeight;
    //   currentHeight = await page.evaluate('document.body.scrollHeight');
    //   await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    //   await page.waitForTimeout(1000);
    // }

    const games = await page.$$eval('.search_result_row', (rows) => {
        return rows.map((row) => ({
            title: row.querySelector('.title').textContent.trim(),
            isDiscounted: row.querySelector('.discount_pct') ? true : false,
            discountPercentage: row.querySelector('.discount_pct') ? parseInt(row.querySelector('.discount_pct').textContent.trim().replace("-", "").replace("%", "")) : null,
        }));
    });

    console.log(games);

    // Write the games to a json file
    fs.writeFileSync('./steam-deals.json', JSON.stringify(games, null, 2));

    await browser.close();
}

scrapeSteamDeals();