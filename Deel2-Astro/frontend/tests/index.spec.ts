import { test, expect } from '@playwright/test';

// Checking if the page is loaded correctly
test('on correct page', async ({ page }) => {
  await page.goto('/astro-build');
  await expect(page).toHaveTitle(/Steam deals/);
});

// Checking if frontend contains a list og games
test('contains list of games', async ({ page }) => {
  await page.goto('/astro-build');

  //Checks if table is visible
  const table = page.locator('#steam-deals-table');
  await expect(table).toBeVisible();

  // Check if there is at least one row in the table (excluding header)
  const rowCount = await table.locator('tbody tr').count();
  await expect(rowCount).toBeGreaterThanOrEqual(1);
});

// Checking if frontend contains a search input field
test('contains search input field', async ({ page }) => {
  await page.goto('/astro-build');

  // Check if the search input field is present
  const searchInput = page.locator('#search-input[type="text"]');
  await expect(searchInput).toBeVisible();
});

// Checking if slider filtering works
test('slider filtering works', async ({ page }) => {
  const sliderFilter = 50;

  await page.goto('/astro-build');

  // Locate the slider and set its value
  const slider = page.locator('#discount-range-slider[type="range"]');
  await slider.fill(sliderFilter.toString());

  // Check if the table updates accordingly
  const table = page.locator('#steam-deals-table');
  const visibleRows = table.locator('tbody tr:visible');
  const rowCount = await visibleRows.count();

  for (let i = 0; i < rowCount; i++) {
    const discountCell = visibleRows.nth(i).locator('td[data-discount-percentage]');
    const discountText = await discountCell.textContent();
    const discountValue = parseInt(discountText?.replace('%', '') || '0', 10);
    expect(discountValue).toBeGreaterThanOrEqual(sliderFilter);
  }
});

// Checking if search and slider filtering works
test('search and slider filtering works', async ({ page }) => {
  const inputFilter = 'total';
  const sliderFilter = 20;
  
  await page.goto('/astro-build');

  // Locate the search input field and enter a search term
  const searchInput = page.locator('#search-input[type="text"]');
  await searchInput.fill(inputFilter);

  // Locate the slider and set its value
  const slider = page.locator('#discount-range-slider[type="range"]');
  await slider.fill(sliderFilter.toString());

  // Check if the table updates accordingly
  const table = page.locator('#steam-deals-table');
  const visibleRows = table.locator('tbody tr:visible');
  const rowCount = await visibleRows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = visibleRows.nth(i);

    // Check game title contains the input filter
    const titleCell = row.locator('td[data-game-title]');
    const titleText = await titleCell.textContent();
    expect(titleText?.toLowerCase()).toContain(inputFilter.toLowerCase());

    // Check discount percentage meets the slider filter
    const discountCell = row.locator('td[data-discount-percentage]');
    const discountText = await discountCell.textContent();
    const discountValue = parseInt(discountText?.replace('%', '') || '0', 10);
    expect(discountValue).toBeGreaterThanOrEqual(sliderFilter);
  }
});