document.addEventListener("DOMContentLoaded", function () {
	const table = document.getElementById("steam-deals-table")
	let dataTable
	if (table && window.DataTable) {
		dataTable = new window.DataTable(table)
	}

	// Custom search/filter logic
	const searchInput = document.getElementById("search-input")
	const discountSlider = document.getElementById("discount-range-slider")
	const rows = document.querySelectorAll("#steam-deals-table tbody tr")

	function filterRows() {
		const search = searchInput.value.toLowerCase()
		const minDiscount = parseInt(discountSlider.value, 10)

		rows.forEach((row) => {
			const title = row.querySelector("td").textContent.toLowerCase()
			const discountCell = row.querySelector("td:last-child")
			const discount = parseInt(discountCell.textContent) || 0
			const matches = title.includes(search) && discount >= minDiscount
			row.style.display = matches ? "" : "none"
		})

		// Redraw DataTable to update pagination
		if (dataTable) {
			dataTable.redraw()
		}
	}

	searchInput.addEventListener("input", filterRows)
	discountSlider.addEventListener("input", filterRows)
})
