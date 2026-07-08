const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  
  // Test 1: Desktop Happy Path
  console.log("--- Testing Desktop View ---");
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  console.log("Navigating to http://localhost:3000 ...");
  let response;
  try {
    response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    console.log("Failed to load page: " + e.message);
    if (errors.length > 0) console.log("Errors: ", errors);
    process.exit(1);
  }

  if (response.status() >= 400) {
    console.log(`Failed to load page, status: ${response.status()}`);
    console.log("Errors found during load:", errors);
  } else {
    console.log("Page loaded successfully.");
  }

  // 1. Edge Case: Empty Input
  console.log("Testing Empty Input...");
  await page.click('button:has-text("Extract")').catch(() => console.log("Extract button not found"));
  await page.waitForTimeout(500);
  const errorMsg = await page.locator('text=Please enter a URL').isVisible().catch(() => false);
  if (errorMsg) {
    console.log("Empty input validation works.");
  } else {
    console.log("Empty input validation failed or element not found.");
  }

  // 2. Test Happy Path (URL input)
  console.log("Testing URL Input Happy Path...");
  // Fill the URL input (assuming there's only one URL input)
  await page.fill('input[type="url"]', 'https://example.com').catch(() => console.log("URL input not found"));
  await page.click('button:has-text("Extract")').catch(() => console.log("Extract button not found"));
  
  console.log("Waiting for extraction (this might take up to 30s)...");
  // wait for either success or failure
  try {
    await page.waitForSelector('text=Extracted Text preview', { timeout: 30000 });
    console.log("Extraction successful.");
  } catch (e) {
    console.log("Extraction failed or UI did not update within 30s.");
  }

  console.log("Errors captured so far:");
  errors.forEach(e => console.log(e));

  // Test 2: Mobile Responsiveness
  console.log("\n--- Testing Mobile View ---");
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true });
  const mobilePage = await mobileContext.newPage();
  
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const isMobileHeaderVisible = await mobilePage.locator('text=CARO').isVisible();
  console.log("Mobile page loaded. Header visible:", isMobileHeaderVisible);

  await browser.close();
})();
