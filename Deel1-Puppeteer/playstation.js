import puppeteer from 'puppeteer';

// Scrape Playstations
async function scrapePlaystations() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://www.coolblue.be/nl/consoles/playstation5', { waitUntil: 'networkidle0' });

  const pageTitle = await page.$eval('.filtered-search__header h1', (element) => element.textContent.trim());

  const products = await page.$$eval('.product-card', (rows) => {
    return rows.map((row) => ({
      productTitle: row.querySelector('.product-card__title').textContent.trim(),
      price: row.querySelector('.sales-price__current').textContent.trim(),
       beschikbaarheid: (
         row.querySelector('.color--available, .color--unavailable')?.textContent.trim() || ''
       ),
    }));
  });

  const filteredProducts = products.filter((product) => {
    product.price > 600;
  });

  console.log(pageTitle);
  console.log(products);
  console.log(filteredProducts);

  await browser.close();
}

export { scrapePlaystations };
