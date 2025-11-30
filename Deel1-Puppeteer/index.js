import { scrapePlaystations } from "./playstation.js"
import { scrapeLaptops } from "./laptop.js"
import fs from "fs"
import { writeOrMergeJson } from "./util.js"

// create JSON with filtered playstation products over 600 euro
const filteredProducts = await scrapePlaystations()
writeOrMergeJson("playstations.json", filteredProducts)

// create JSON with filtered laptop products
const filter = {
	prijs: { max: 800 },
	beschikbaar: true,
	aantalReviews: { min: 1 },
	ram: { min: 16 },
	opslag: { min: 500 },
	schermbreedte: { min: 14, max: 17 },
}
const filteredLaptops = await scrapeLaptops(filter)
writeOrMergeJson("laptops.json", filteredLaptops)

