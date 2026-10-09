import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('🚀 Starting Chrome automated browser verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const httpErrors = [];

  page.on('response', (res) => {
    if (res.status() >= 400) {
      httpErrors.push(`${res.status()} ${res.url()}`);
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push(text);
      console.error('Browser console error:', text);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
    console.error('Uncaught page error:', err);
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Overview screenshot at 1920x1080...');
  const screenshot1Path = path.resolve('public', 'phase1_1920_overview.png');
  await page.screenshot({ path: screenshot1Path, fullPage: false });

  // Test clicking Scenario B: Sensor Spike (BW-04)
  console.log('Testing Scenario B: Sensor Spike (BW-04)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario B"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const textBW04 = await page.$eval('.station-id', el => el.textContent);
  console.log('Scenario B Station ID:', textBW04 === 'BW-04' ? 'PASS (BW-04)' : `FAIL (${textBW04})`);

  // Test clicking Scenario D: Uncertain (BW-12)
  console.log('Testing Scenario D: Uncertain (BW-12)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario D"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const textBW12 = await page.$eval('.station-id', el => el.textContent);
  console.log('Scenario D Station ID:', textBW12 === 'BW-12' ? 'PASS (BW-12)' : `FAIL (${textBW12})`);

  // Test clicking Scenario A: Normal (BW-01)
  console.log('Testing Scenario A: Normal (BW-01)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario A"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const textBW01 = await page.$eval('.station-id', el => el.textContent);
  console.log('Scenario A Station ID:', textBW01 === 'BW-01' ? 'PASS (BW-01)' : `FAIL (${textBW01})`);

  // Return to Scenario C: Groundwater Anomaly (BW-05)
  console.log('Testing Scenario C: True Depletion (BW-05)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario C"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const textBW05 = await page.$eval('.station-id', el => el.textContent);
  console.log('Scenario C Station ID:', textBW05 === 'BW-05' ? 'PASS (BW-05)' : `FAIL (${textBW05})`);

  // Scroll down to capture the Analytics and Borewell Details sections
  console.log('Scrolling down to capture Analytics and Details sections...');
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 800));
  const screenshot2Path = path.resolve('public', 'phase1_1920_details.png');
  await page.screenshot({ path: screenshot2Path, fullPage: false });

  // Test 1280x800 resolution
  console.log('Testing 1280x800 viewport responsiveness...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 800));
  const screenshot3Path = path.resolve('public', 'phase1_1280_compact.png');
  await page.screenshot({ path: screenshot3Path, fullPage: false });

  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`HTTP 4xx/5xx count: ${httpErrors.length}`);
  if (httpErrors.length > 0) {
    console.log('HTTP Errors:', httpErrors);
  }
  console.log(`Console Errors count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  } else {
    console.log('✅ Clean execution: 0 console errors!');
  }
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
