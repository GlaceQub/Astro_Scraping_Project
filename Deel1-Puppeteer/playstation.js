import puppeteer from "puppeteer"
import { formatPrijs } from "./util.js"

// Scrape Playstations
async function scrapePlaystations() {
	const browser = await puppeteer.launch({ headless: "new" })
	const page = await browser.newPage()
	await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
	await page.goto("https://www.coolblue.be/nl/consoles/playstation5", { waitUntil: "networkidle0" })

	const pageTitle = await page.$eval(".filtered-search__header h1", (element) => element.textContent.trim())

	const products = await page.$$eval(".product-card", (rows) => {
		return rows.map((row) => ({
			productTitle: row.querySelector(".product-card__title")?.textContent.trim() || "Geen titel gevonden",
			price: row.querySelector(".sales-price__current")?.textContent.trim() || "Geen prijs gevonden",
			beschikbaarheid: row.querySelector(".color--available, .color--unavailable")?.textContent.trim() || "Geen beschikbaarheid gevonden",
		}))
	})

	// convert price strings to numbers in Node context using imported formatPrijs
		for (const p of products) {
			p.price = p.price ? formatPrijs(p.price) : null
		}

	const filteredProducts = products.filter((product) => {
		return product.price > 600
	})

	console.log(pageTitle)
	//console.log(products)
	console.log(filteredProducts)

	await browser.close()

	return filteredProducts
}

export { scrapePlaystations }
