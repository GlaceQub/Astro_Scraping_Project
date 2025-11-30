import fs from "fs"
import { sep } from "path"

function formatPrijs(prijsStr) {
  if (prijsStr == null) return null
  const raw = String(prijsStr).trim()
  if (raw === "") return null
  // single replace: remove thousands separator (dot), convert comma to dot, and strip other unwanted chars
  const s = raw.replace(/[^0-9-.,]|[.,]/g, (m) => (m === "," ? "." : ""))
  const prijsValue = parseFloat(s)
  return Number.isNaN(prijsValue) ? null : prijsValue
}

function writeOrMergeJson(filePath, data) {
	try {
		// if file exists, truncate (clear contents) but keep the file itself
		if (fs.existsSync(filePath)) {
			try {
				fs.truncateSync(filePath, 0)
			} catch (e) {}
		}
		// write fresh content (overwrites existing content)
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
	} catch (err) {
		// fallback: attempt to overwrite directly
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
	}
}

export { formatPrijs, writeOrMergeJson }
