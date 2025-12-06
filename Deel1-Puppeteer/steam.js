import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import fs from "fs"
import os from "os"
import path from "path"

puppeteer.use(StealthPlugin())

const SALES_STEAM_DB_URL = "https://steamdb.info/sales/"
const BASE_URL_FILTER = "?displayOnly=Game"
const URL_FILTER_PARAMS = ["reviews", "tags"]
const DEFAULT_STEAM_FILTER = {
	tags: [],
	priceRange: [0, 100],
	discount: [0, null],
	release: ["2000-1-01", "2024-12-31"],
	reviews: [100, null],
}
const DETAIL_TABLE_KEYS = {
	appId: "App ID",
	appType: "App Type",
	developer: "Developer",
	publisher: "Publisher",
	franchise: "Franchise",
	supportedSystems: "Supported Systems",
	Technologies: "Technologies",
	releaseDate: "Release Date",
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function getEdgePath() {
    const candidates = [
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ]
    const found = candidates.find((p) => fs.existsSync(p))
    if (!found) {
        console.error("Edge not found. Checked:", candidates.join(" | "))
        throw new Error("msedge.exe not found in default paths")
    }
    return found
}

/*********************************************************
                  MAIN SCRAPING FUNCTIONS
 ********************************************************/

export async function scrapeOnSaleSteamGames(filter = DEFAULT_STEAM_FILTER) {
    const userDataDir = path.join(os.homedir(), "puppeteer-edge-steamdb")
    console.log("Using persistent Edge profile:", userDataDir)

    const browser = await puppeteer.launch({
        headless: false, // MUST be false to solve captcha manually
        executablePath: getEdgePath(),
        userDataDir, // keeps cookies/session across runs
        defaultViewport: { width: 1366, height: 900 },
        args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--lang=en-US,en",
        ],
    })

    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0")

    console.log("Navigating to SteamDB sales...")
    await page.goto(SALES_STEAM_DB_URL, { waitUntil: "domcontentloaded", timeout: 60000 })
    await delay(3000)

    console.log("Current URL:", page.url())

    // Check if redirected to challenge
    const html = await page.content()
    if (!page.url().includes("steamdb.info") || /challenge|captcha|just a moment/i.test(html)) {
        console.log("⚠️  Bot detection active. Please solve the captcha/challenge in the Edge window.")
        console.log("Waiting 90 seconds for you to solve it...")
        await delay(90000) // Give you time to solve
        console.log("Continuing... URL now:", page.url())
    }

    // If STILL not on steamdb, abort
    if (!page.url().includes("steamdb.info/sales")) {
        console.error("❌ Still redirected after waiting. Aborting.")
        await browser.close()
        return []
    }

    console.log("✅ On SteamDB sales page, proceeding with scrape...")
    const result = await scrapeGamesByUrlFilter(page, filter)

    try { await page.close() } catch {}
    try { await browser.close() } catch {}
    return result
}

async function scrapeGamesByUrlFilter(page, filter) {
	let games = []
	// Navigate to basic sales page to extract tag ids
	await page.goto(SALES_STEAM_DB_URL, { waitUntil: "domcontentloaded", timeout: 60000 })
	console.log("Navigated to sales page. URL:", page.url())
	await delay(2000)

	// Debug: snapshot what actually loaded
	try {
		await page.screenshot({ path: "steam_sales_debug.png" })
		fs.writeFileSync("steam_sales_debug.html", await page.content())
	} catch (e) {
		console.warn("Debug snapshot failed:", e.message)
	}

	// If a challenge/captcha page, pause for manual solve
	const html = await page.content()
	if (/just a moment|checking your browser|captcha/i.test(html)) {
		console.log("Challenge detected. Solve it in Edge; pausing 60s…")
		await delay(60000)
	}

	// Get full url filter
	const tagIds = await determineTagIds(page, filter.tags)
	if (tagIds.length === 0) {
		console.log("No valid tag IDs found, aborting scrape.")
		return []
	}
	const pageUrl = SALES_STEAM_DB_URL + (await getFullUrlFilter(filter, tagIds))

	// Navigate to steam tags page already filtered on tags and reviews
	await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 })
	await delay(1500)

	// Enable all entries on page (if available)
	try {
		await page.select("#dt-length-0", "-1")
	} catch {}
	await page.waitForSelector(".table-sales tr.app", { timeout: 20000 })

	// Scrape all game rows on the page
	games = await page.$$eval(".table-sales tr.app", (rows) =>
		rows.map((row) => {
			const tds = row.querySelectorAll("td")
			const gameDbLink = tds[2]?.querySelector("a")?.href || null
			return {
				gameStoreLink: tds[0]?.querySelector("a")?.href || null,
				gameDbLink,
				gameTitle: tds[2]?.textContent?.trim() || null,
				discount: tds[3]?.textContent?.trim() || null,
				price: tds[4]?.textContent?.trim() || null,
				rating: tds[5]?.textContent?.trim() || null,
				release: tds[6]?.textContent?.trim() || null,
				ends: tds[7]?.textContent?.trim() || null,
				started: tds[8]?.textContent?.trim() || null,
			}
		})
	)

	// Fetch per-game details sequentially with small delays
	const MAX_DETAILS = 12
	let processed = 0
	for (const g of games) {
		if (processed >= MAX_DETAILS) break
		if (!g.gameDbLink) continue
		try {
			await delay(800 + Math.floor(Math.random() * 800))
			await page.goto(g.gameDbLink, { waitUntil: "domcontentloaded", timeout: 45000 })
			g.details = await getDetailsForGame(page, g.gameDbLink)
			processed++
		} catch (e) {
			console.warn("Failed details for:", g.gameDbLink, e.message)
			g.details = null
		}
	}

	const filteredGames = await filterGames(games, filter)
	console.log(`Found ${filteredGames.length} games matching the filter criteria.`)
	return filteredGames
}

async function getDetailsForGame(page, gameDbLink) {
	// Caller already navigated here
	const details = {}
	for (const [key, label] of Object.entries(DETAIL_TABLE_KEYS)) {
		details[key] = await getTableValue(page, label)
	}
	// Extract tags (strip emojis)
	try {
		details.tags = await page.$eval(".header-app-tags", (el) =>
			Array.from(el.querySelectorAll("a"))
				.map((a) => a.textContent.replace(/^[^A-Za-z0-9À-ÖØ-öø-ÿ]+/, "").trim())
				.filter(Boolean)
		)
	} catch {
		details.tags = []
	}
	return details
}

async function filterGames(games, filter) {
	return games.filter((game) => {
		// Price range filtering
		if (filter.priceRange[0] != null && formatPrijs(game.price) < filter.priceRange[0]) return false
		if (filter.priceRange[1] != null && formatPrijs(game.price) > filter.priceRange[1]) return false
		// Discount filtering
		if (filter.discount[0] != null && Number(game.discount) < filter.discount[0]) return false
		if (filter.discount[1] != null && Number(game.discount) > filter.discount[1]) return false
		// Release date filtering
		if (new Date(game.release) < new Date(filter.release[0]) || new Date(game.release) > new Date(filter.release[1])) return false
		return true
	})
}

/*********************************************************
                    HELPER FUNCTIONS
 ********************************************************/
async function createPage(browser) {
	const newPage = await browser.newPage()
	await newPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0")
	return newPage
}

async function getFullUrlFilter(filter, tagIds = null) {
	let urlFilter = BASE_URL_FILTER
	for (const [key, value] of Object.entries(filter)) {
		// Only process supported URL params
		if (!URL_FILTER_PARAMS.includes(key)) continue
		switch (key) {
			case "tags": {
				if (!Array.isArray(value) || value.length === 0 || !Array.isArray(tagIds)) break
				const map = new Map(tagIds.map((t) => [t.tagName, t.tagId]))
				const ids = value.map((name) => map.get(String(name).toLowerCase())).filter(Boolean)
				if (ids.length) urlFilter += `&tagid=${encodeURIComponent(ids.join(","))}`
				break
			}
			case "reviews": {
				if (Array.isArray(value)) {
					if (value[0] != null) urlFilter += `&min_reviews=${value[0]}`
					if (value[1] != null) urlFilter += `&max_reviews=${value[1]}`
				}
				break
			}
		}
	}
	return urlFilter
}

async function determineTagIds(page, tagNamesToFind) {
    await page.waitForSelector("#js-select-tags", { timeout: 20000 })
    await page.evaluate(() => {
        const details = document.getElementById("js-select-tags")
        if (details && !details.open) details.open = true
    })
    // Wait and verify labels
    const selector = "#js-select-tags .filter-scrollable > label"
    await page.waitForSelector(selector, { timeout: 20000 }).catch(() => {})
    const count = await page.$$eval(selector, els => els.length).catch(() => 0)
    console.log("Tag labels found:", count)
    if (count === 0) return []

    const tags = await page.$$eval(selector, (labels) =>
        labels.map((label) => {
            const input = label.querySelector('input[name="tagid"]')
            const firstSpan = label.querySelector("span")
            const rawName = firstSpan?.textContent?.trim() || ""
            const tagName = rawName.replace(/^[^A-Za-z0-9À-ÖØ-öø-ÿ]+/, "").trim().toLowerCase()
            return { tagId: input?.value ?? null, tagName }
        })
    )

	if (tags.length === 0) {
		console.log("Error: No tags found in page.")
		return []
	}
	const wanted = tagNamesToFind.map((t) => String(t).toLowerCase())
	const tagIds = tags.filter((t) => wanted.includes(t.tagName))
	return tagIds
}

// Always return array of strings (even if single value)
async function getTableValue(page, label) {
	return await page.$$eval(
		".header-wrapper table tr",
		(rows, label) => {
			for (const row of rows) {
				const tds = row.querySelectorAll("td")
				if (tds.length === 2 && tds[0].textContent.trim() === label) {
					let values = Array.from(tds[1].querySelectorAll("a"))
						.map((a) => a.textContent.trim())
						.filter(Boolean)
					if (values.length === 0 && tds[1].textContent.trim()) {
						values = [tds[1].textContent.trim()]
					}
					return values
				}
			}
			return []
		},
		label
	)
}
