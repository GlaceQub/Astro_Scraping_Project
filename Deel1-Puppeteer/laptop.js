import puppeteer from "puppeteer"
import { formatPrijs } from "./util.js"

const filterDefaults = {
	prijs: { min: null, max: null },
	beschikbaar: null,
	aantalReviews: { min: null, max: null },
	ram: { min: null, max: null },
	opslag: { min: null, max: null },
	schermbreedte: { min: null, max: null },
}
const specLabels = { ram: "intern werkgeheugen (RAM)", processor: "processor", opslag: "totale opslagcapaciteit", schermbreedte: "schermdiagonaal" }
const urls = {
	windows: "https://www.coolblue.be/nl/laptops/windows/filter",
	macBook: "https://www.coolblue.be/nl/laptops/apple-macbook/filter",
}

// Scrape Laptops on Coolblue
async function scrapeLaptops(filter = filterDefaults) {
	// Launch browser
	const browser = await puppeteer.launch({ headless: "new" })
	let windowspage = null
	let macBookPage = null
	try {
		// Scrape windows laptops
		windowspage = await browser.newPage()
		await windowspage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
		const windowsLaptops = await scrapeProducts(windowspage, urls.windows, filter)
		await windowspage.close()
		// Scrape macbooks
		macBookPage = await browser.newPage()
		await macBookPage.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15")
		const macBooks = await scrapeProducts(macBookPage, urls.macBook, filter)
		await macBookPage.close()
		// Combine products
		const products = [...windowsLaptops, ...macBooks]
		console.log ("Total laptops scraped:", products.length)
		// Filter and return products
		const specsFilter = { ram: filter.ram, opslag: filter.opslag, schermbreedte: filter.schermbreedte }
		console.log("Filtering laptops with specs filter:", specsFilter)
		const filteredProducts = await filterProducts(products, specsFilter)
		console.log("Total laptops after filtering:", filteredProducts.length)
		return filteredProducts
	} finally {
		try {
			if (windowspage && !windowspage.isClosed()) await windowspage.close()
		} catch (e) {}
		try {
			if (macBookPage && !macBookPage.isClosed()) await macBookPage.close()
		} catch (e) {}
		try {
			await browser.close()
		} catch (e) {}
	}
}

// Scrape products with detailed specifications
async function scrapeProducts(page, url, filter) {
	const products = []
	// return if no url provided
	if (!url) return products
	// first collect basic metadata and product page urls from the listing
	const metas = await scrapeMeta(page, url)
	// filter out products base on meta data only
	const metaFilter = { prijs: filter.prijs, beschikbaar: filter.beschikbaar, aantalReviews: filter.aantalReviews }
	const filteredMetas = await filterProducts(metas, metaFilter)

	// loop over each filtered meta to push to products array and if available, fetch detailed specifications
	for (const meta of filteredMetas) {
		// if there is no product url, skip fetching detailed specifications
		if (!meta.url) {
			products.push({ ...meta, specificaties: null })
			continue
		}
		// then visit each product page to collect detailed specifications
		const specificaties = await scrapeSpecificaties(page, meta.url)
		products.push({ ...meta, specificaties: specificaties })
	}
	console.log(`Total products scraped from ${url}:`, products.length)
	return products
}

// Scrape basic metadata and product page urls from listing page
async function scrapeMeta(page, url) {
	await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

	// Collect all pages in pagination
	const paginationSelector = "nav .pagination .pagination__link"
	await page.waitForSelector(paginationSelector, { timeout: 30000 })
	const totalPages = await page.$eval(paginationSelector, (el) => {
		const raw = el.getAttribute("data-component") || el.dataset.component || null
		if (!raw) return 1
		const tryParse = (s) => {
			try {
				return JSON.parse(s)
			} catch {
				return null
			}
		}
		let parsed = tryParse(raw) || tryParse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&"))
		return parsed?.[0]?.options?.ga4?.params?.total_indices ?? 1
	})

	// generate all page urls
	const pageUrls = []
	for (let i = 1; i <= totalPages; i++) {
		const pageUrl = `${url}?pagina=${i}`
		pageUrls.push(pageUrl)
		// console.log("Generated page URL:", pageUrl)
	}

	const allListings = []
	for (const pageUrl of pageUrls) {
		await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30000 })
		// first collect basic metadata and product page urls from the listing
		// extract raw strings in page context
		const listings = await page.$$eval(".product-card", (rows) =>
			rows.map((row) => {
				const linkEl = row.querySelector("a.js-product-picture, a.link, a")
				const beschikbaarheidEl = row.querySelector(".color--available, .color--unavailable")
				return {
					productTitle: row.querySelector(".product-card__title")?.textContent.trim() || null,
					aantalReviews: row.querySelector(".review-rating__reviews")?.textContent.replace(/\D/g, "").trim() || null,
					beschikbaarheid: {
						beschikbaar: beschikbaarheidEl ? beschikbaarheidEl.classList.contains("color--available") : null,
						details: beschikbaarheidEl?.textContent.trim() || null,
					},	
					// return raw price string only
					price: row.querySelector(".sales-price__current")?.textContent.trim() || null,
					url: linkEl ? linkEl.href || linkEl.getAttribute("href") : null,
				}
			})
		)
		// convert price strings to numbers in Node context using imported formatPrijs
		for (const p of listings) {
			p.price = p.price ? formatPrijs(p.price) : null
		}
		console.log(`listings on page ${pageUrl}:`, listings.length)
		allListings.push(...listings)
	}
	return allListings
}

// Scrape detailed specifications from product page
async function scrapeSpecificaties(page, productPageUrl) {
	await page.goto(productPageUrl, { waitUntil: "networkidle2", timeout: 60000 })

	// collect detailed specifications
	const productSpecRowsSelector = "#product-specifications tbody>tr"
	// read the whole spec table once and map labels -> values
	const allSpecs = await page.$$eval(productSpecRowsSelector, (rows) => {
		const map = {}
		for (const row of rows) {
			const label = row.querySelector("td.css-wq6zv")?.textContent?.trim().toLowerCase() || ""
			const value = row.querySelector("td.css-7wsoqo")?.textContent?.trim() || null
			if (label) map[label] = value
		}
		return map
	})
	// map the specFields to the values we found
	const specificaties = {}
	for (const [spec, label] of Object.entries(specLabels)) {
		specificaties[spec] = allSpecs[label.toLowerCase()] ?? null
	}
	console.log(`Scraped specifications for ${productPageUrl}:`, specificaties)
	return specificaties
}

async function filterProducts(products, filter) {
	return products.filter((product) => {
		console.log("Filtering product:", product)
		// Filter by prijs
		const priceValue = product.price || 0
		if (filter.prijs) {
			if (filter.prijs.max !== null && priceValue > filter.prijs.max) return false
			if (filter.prijs.min !== null && priceValue < filter.prijs.min) return false
		}
		// Filter by beschikbaarheid
		if (filter.beschikbaar != null && (product.beschikbaarheid?.beschikbaar ?? null) !== filter.beschikbaar) return false
		// Filter by aantalReviews
		const reviewCount = parseInt(product.aantalReviews) || 0
		if (filter.aantalReviews) {
			if (filter.aantalReviews.min !== null && reviewCount < filter.aantalReviews.min) return false
			if (filter.aantalReviews.max !== null && reviewCount > filter.aantalReviews.max) return false
		}
		// Filter by RAM
		const ramValue = parseInt(product.specificaties?.ram?.replace(/[^0-9]/g, "")) || 0
		if (filter.ram) {
			if (filter.ram.min !== null && ramValue < filter.ram.min) return false
			if (filter.ram.max !== null && ramValue > filter.ram.max) return false
		}
		// Filter by opslag
		const opslagValue = parseInt(product.specificaties?.opslag?.replace(/[^0-9]/g, "")) || 0
		if (filter.opslag) {
			if (filter.opslag.min !== null && opslagValue < filter.opslag.min) return false
			if (filter.opslag.max !== null && opslagValue > filter.opslag.max) return false
		}
		// Filter by schermbreedte
		const schermValue = parseFloat(product.specificaties?.schermbreedte?.replace(/[^0-9,.-]+/g, "").replace(",", ".")) || 0
		if (filter.schermbreedte) {
			if (filter.schermbreedte.min !== null && schermValue < filter.schermbreedte.min) return false
			if (filter.schermbreedte.max !== null && schermValue > filter.schermbreedte.max) return false
		}
		return true
	})
}

export { scrapeLaptops }
