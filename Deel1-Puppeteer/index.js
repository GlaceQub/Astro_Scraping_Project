import { scrapePlaystations } from "./playstation.js";
import fs from "fs";

// create JSON with filtered playstation products over 600 euro
const filteredProducts = await scrapePlaystations();
fs.writeFileSync("playstations.json", JSON.stringify(filteredProducts, null, 2), "utf-8");
