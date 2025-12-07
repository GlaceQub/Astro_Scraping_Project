import puppeteer from "puppeteer"
import { formatPrijs } from "./util.js"

const DEFAULT_FILTER = {
	players: [2, 6],
	minAge: 12,
	minReviews: 50,
	price: [0, 50],
	language: ["Nederlands"],
}
const BASE_BOARDGAMES_URL = "https://www.bol.com/be/nl/l/bordspellen/20300/"

/*********************************************************
                  MAIN SCRAPING FUNCTIONS
 ********************************************************/

export async function scrapeBoardgames(filter = DEFAULT_FILTER) {
	console.log("Scraping boardgames on Bol.com ...")
	let browser = null
	let boardgamesPage = null
	try {
		// Initialize Puppeteer
		browser = await puppeteer.launch({ headless: "new" })
		boardgamesPage = await createPage(browser)

		// Retrieve boardgames
		const boardgames = await retrieveBoardgames(boardgamesPage)
		console.log(`Total boardgames retrieved: ${boardgames.length}`)

		// Filter boardgames based on filter criteria
		const filteredBoardgames = await filterBoardgames(boardgames, filter)
		console.log(`Total boardgames after filtering: ${filteredBoardgames.length}`)

		// Retrieve boardgame details
		for (let [index, bg] of filteredBoardgames.entries()) {
			filteredBoardgames[index] = await fillBoardgameDetails(boardgamesPage, bg)
		}
		console.log(`Filled in details for all filtered boardgames.`)
		return filteredBoardgames
	} finally {
		if (boardgamesPage) await boardgamesPage.close()
		if (browser) await browser.close()
	}
}

async function retrieveBoardgames(boardgamesPage) {
	let allBoardgames = []

	//Retrieve number of pages
	const totalPages = await retrieveTotalPages(boardgamesPage)
	// const totalPages = 10 // Limit to first 10 pages for testing
	console.log(`Total pages of products: ${totalPages}`)

	// Navigate to the boardgames page
	for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
		const pageUrl = `${BASE_BOARDGAMES_URL}?page=${currentPage}`
		await boardgamesPage.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 40000 })
		console.log(`Scraping boardgames from page ${pageUrl} ...`)
		await boardgamesPage.waitForSelector('[data-bltgh*="ProductTitle"]', { timeout: 20000 })
		console.log(`waited for product titles to load on page ${currentPage}`)

		// Scrape boardgames on the current page
		const boardgames = await boardgamesPage.$$eval('div[data-bltgi*="ProductList"]:not([style="display: none !important;"]):not([data-bltgi*="considerationDisplay"])', (products) => {
			return products
				.filter((el) => el.style.display !== "none")
				.filter((el) => window.getComputedStyle(el).display !== "none")
				.map((product) => {
					const titleElement = product.querySelector('[data-bltgh*="ProductTitle"]')
					const name = titleElement?.textContent?.trim() || ""
					const productLink = titleElement?.href || ""

					const metaListElement = product.querySelector("ul.mb-2.line-clamp-2")
					const liElements = metaListElement ? metaListElement.querySelectorAll("li") : []
					const minAge = liElements[0]?.textContent?.trim() || ""
					const gemDuration = liElements[1]?.textContent?.trim() || ""
					const players = liElements[2]?.textContent?.trim() || ""
					const language = liElements[4]?.textContent?.trim() || ""

					const reviews = product.querySelector("div[role=img].inline-flex+p")?.textContent?.replace(/\D/g, "").trim() || ""

					// Price extraction
					const priceContainer = product.querySelector("div.md\\:mt-2, .md\\:mt-2")
					let price = ""
					if (priceContainer) {
						const priceBlock = priceContainer.querySelector(".font-bold.grid")
						if (priceBlock) {
							const spans = Array.from(priceBlock.querySelectorAll('span[aria-hidden="true"]'))
							const euro = spans[0]?.textContent?.trim() || ""
							const cent = spans[spans.length - 1]?.textContent?.trim() || ""
							if (euro && cent) price = `${euro}.${cent}`
							else if (euro) price = euro
						}
					}

					const availability = product.querySelector("div.text-accent3-text-interactive-default")?.textContent?.trim() || ""
					return { name, productLink, players, minAge, gemDuration, language, reviews, price, availability }
				})
		})
		console.log(`Retrieved ${boardgames.length} boardgames from page ${currentPage}`)
		console.log(`Pushing to allBoardgames array...`)
		allBoardgames.push(...boardgames)
	}
	return allBoardgames
}

async function filterBoardgames(boardgames, filter) {
	return boardgames.filter((bg) => {
		console.log(`Filtering boardgame: ${bg.name}`)

		// Players: must be within range, but allow null for min/max
		const playerCount = parseInt(bg.players.match(/\d+/)?.[0] ?? "0", 10)
		if (
			(filter.players[0] != null && playerCount < filter.players[0]) ||
			(filter.players[1] != null && playerCount > filter.players[1])
		) return false

		// Minimum age
		const age = parseInt(bg.minAge.match(/\d+/)?.[0] ?? "0", 10)
		if (filter.minAge != null && age < filter.minAge) return false

		// Minimum reviews
		const reviews = parseInt(bg.reviews ?? "0", 10)
		if (filter.minReviews != null && reviews < filter.minReviews) return false

		// Price range
		const price = parseFloat(bg.price.replace(",", "."))
		if (
			(filter.price[0] != null && price < filter.price[0]) ||
			(filter.price[1] != null && price > filter.price[1])
		) return false

		// Language (case-insensitive, must match one of allowed)
		if (
			filter.language &&
			!filter.language.some((lang) => (bg.language || "").toLowerCase().includes(lang.toLowerCase()))
		) return false

		return true
	})
}

async function fillBoardgameDetails(boardgamePage, boardgame) {
	await boardgamePage.goto(boardgame.productLink, { waitUntil: "domcontentloaded", timeout: 40000 })
	console.log(`Filling details for boardgame: ${boardgame.name} on page ${boardgame.productLink}`)

	try {
		boardgame["details"] = await boardgamePage.$eval(".js_specifications_content", (specsContent) => {
			const details = {}
			const rows = specsContent.querySelectorAll(".specs__row")
			rows.forEach((row) => {
				const titleElem = row.querySelector(".specs__title")
				const valueElem = row.querySelector(".specs__value")
				let key = ""
				let value = ""

				if (titleElem) {
					// Remove tooltip elements from key
					const tooltips = titleElem.querySelectorAll(".tooltip, .specs__tooltip")
					tooltips.forEach((t) => t.remove())
					key = titleElem.textContent
						.replace(/\s+/g, " ")
						.replace(/Tooltip.*$/, "")
						.trim()
				}

				if (valueElem) {
					// Remove tooltip elements from value
					const tooltips = valueElem.querySelectorAll(".tooltip, .specs__tooltip")
					tooltips.forEach((t) => t.remove())

					// If value contains a list
					const ul = valueElem.querySelector("ul")
					if (ul) {
						value = Array.from(ul.querySelectorAll("li"))
							.map((li) => li.textContent.replace(/\s+/g, " ").trim())
							.join(", ")
					}
					// If value contains multiple links
					else if (valueElem.querySelectorAll("a").length > 0) {
						value = Array.from(valueElem.querySelectorAll("a"))
							.map((a) => a.textContent.replace(/\s+/g, " ").trim())
							.join(", ")
					}
					// Otherwise, just get the cleaned text
					else {
						value = valueElem.textContent.replace(/\s+/g, " ").trim()
					}
				}

				if (key && value) details[key] = value
			})
			return details
		})
	} catch (err) {
		console.warn(`No specifications found for ${boardgame.name}: ${err.message}`)
		boardgame["details"] = {}
	}
	return boardgame
}
/*********************************************************
                    HELPER FUNCTIONS
 ********************************************************/
async function createPage(browser) {
	const newPage = await browser.newPage()
	await newPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0")
	return newPage
}

async function retrieveTotalPages(page) {
	await page.goto(BASE_BOARDGAMES_URL, { waitUntil: "domcontentloaded", timeout: 40000 })
	const totalPages = await page.$eval(".\\[\\&_ul\\]\\:px-none>div>ul", (ul) => {
		const liElements = ul.querySelectorAll("li")
		const nrLiElements = liElements.length
		console.log(`Number of pagination <li> elements found: ${nrLiElements}`)
		const lastPageIndex = nrLiElements - 1
		console.log(`Last page index: ${lastPageIndex}`)
		return parseInt(liElements[lastPageIndex].textContent.trim())
	})
	return totalPages
}
