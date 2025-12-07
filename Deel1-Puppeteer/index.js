import { scrapePlaystations } from "./playstation.js"
import { scrapeLaptops } from "./laptop.js"
import { scrapeOnSaleSteamGames } from "./steam.js"
import { scrapeBoardgames } from "./boardgames.js"
import { writeOrMergeJson } from "./util.js"

const ACTIVE_SCRAPES = {
	playstations: false,
	laptops: false,
	steamOnSaleGames: false,
	boardgames: true
}

// create JSON with filtered playstation products over 600 euro
if (ACTIVE_SCRAPES.playstations) {
	const filteredProducts = await scrapePlaystations()
	writeOrMergeJson("playstations.json", filteredProducts)
}
// create JSON with filtered laptop products
if (ACTIVE_SCRAPES.laptops) {
	const laptopFilter = {
		prijs: { max: 800 },
		beschikbaar: true,
		aantalReviews: { min: 1 },
		ram: { min: 16 },
		opslag: { min: 500 },
		schermbreedte: { min: 14, max: 17 },
	}
	const filteredLaptops = await scrapeLaptops(laptopFilter)
	writeOrMergeJson("laptops.json", filteredLaptops)
}

// Create JSON with filtered steam games that are on sale
if (ACTIVE_SCRAPES.steamOnSaleGames) {
	const steamFilter = {
		tags: ["local co-op", "adventure"],
		priceRange: [0, 100],
		discount: [0, null],
		release: ["2010-1-01", null],
		reviews: [50, null],
	}
	const filteredOnSaleSteamGames = await scrapeOnSaleSteamGames(steamFilter)
	writeOrMergeJson("steam_games.json", filteredOnSaleSteamGames)
}

// Create JSON with filtered boardgames from bol.com
if (ACTIVE_SCRAPES.boardgames) {
	const boardgameFilter = {
		players: [4, null],
		minAge: 12,
		minReviews: 100,
		price: [20, 50],
		language: ["Nederlands"]
	}
	const filteredBoardgames = await scrapeBoardgames(boardgameFilter)
	writeOrMergeJson("boardgames.json", filteredBoardgames)
}