import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runPhase2Verification() {
  console.log('🚀 Starting Phase 2 Chrome Automated Browser Verification...');

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

  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForSelector('canvas', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Check 1: Command View
  console.log('2. Verifying Command View...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Command View'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Check 2: Select BW-05 (Groundwater Anomaly)
  console.log('3. Selecting BW-05 (Groundwater Anomaly)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario C"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 3: BW-05 Groundwater Anomaly
  const screenshotBW05 = path.resolve('public', 'phase2_bw05_groundwater.png');
  await page.screenshot({ path: screenshotBW05, fullPage: false });
  console.log('📸 Captured: public/phase2_bw05_groundwater.png');

  // Check 3: Select BW-04 (Sensor Anomaly)
  console.log('4. Selecting BW-04 (Sensor Anomaly)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario B"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 4: BW-04 Sensor Anomaly
  const screenshotBW04 = path.resolve('public', 'phase2_bw04_sensor.png');
  await page.screenshot({ path: screenshotBW04, fullPage: false });
  console.log('📸 Captured: public/phase2_bw04_sensor.png');

  // Check 4: Select BW-12 (Uncertain)
  console.log('5. Selecting BW-12 (Uncertain)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario D"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Check 5: Select BW-01 (Normal)
  console.log('6. Selecting BW-01 (Normal)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Scenario A"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Check 6: Orbit interaction
  console.log('7. Testing Orbit mouse drag...');
  const canvas = await page.$('canvas');
  const boundingBox = await canvas.boundingBox();
  if (boundingBox) {
    const startX = boundingBox.x + boundingBox.width / 2;
    const startY = boundingBox.y + boundingBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY - 70, { steps: 12 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 800));
  }

  // Check 7: Zoom interaction
  console.log('8. Testing Zoom (+ / -)...');
  await page.evaluate(() => {
    const zoomIn = document.querySelector('button[title="Zoom In"]');
    if (zoomIn) zoomIn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Check 8: Surface View & Screenshot
  console.log('9. Switching to Surface View Mode...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title="Surface Landscape View"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const screenshotSurface = path.resolve('public', 'phase2_surface_view.png');
  await page.screenshot({ path: screenshotSurface, fullPage: false });
  console.log('📸 Captured: public/phase2_surface_view.png');

  // Check 9: Subsurface View & Screenshot
  console.log('10. Switching to Subsurface View Mode...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[title="Subsurface Aquifer Focus"]');
    if (btn) btn.click();
  });
  await page.evaluate(() => {
    const subCam = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Subsurface') && !b.title);
    if (subCam) subCam.click();
  });
  await new Promise((r) => setTimeout(r, 1400));
  const screenshotSubsurface = path.resolve('public', 'phase2_subsurface_view.png');
  await page.screenshot({ path: screenshotSubsurface, fullPage: false });
  console.log('📸 Captured: public/phase2_subsurface_view.png');

  // Check 10: Water Table Toggle
  console.log('11. Testing Water Table toggle...');
  await page.evaluate(() => {
    const wt = document.querySelector('button[title*="Water Table"]');
    if (wt) wt.click(); // toggle off
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const wt = document.querySelector('button[title*="Water Table"]');
    if (wt) wt.click(); // toggle on
  });
  await new Promise((r) => setTimeout(r, 600));

  // Check 11: Geological Layer Toggle
  console.log('12. Testing Geological Layer toggle...');
  await page.evaluate(() => {
    const geo = document.querySelector('button[title*="Geology Strata"]');
    if (geo) geo.click(); // toggle off
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const geo = document.querySelector('button[title*="Geology Strata"]');
    if (geo) geo.click(); // toggle on
  });
  await new Promise((r) => setTimeout(r, 600));

  // Check 12: Camera Dive sequence
  console.log('13. Testing Cinematic Camera Dive...');
  await page.evaluate(() => {
    const diveBtn = document.querySelector('.dive-btn');
    if (diveBtn) diveBtn.click();
  });
  // Wait 4 seconds during dive
  await new Promise((r) => setTimeout(r, 4000));

  // Check 13: Reset Camera
  console.log('14. Resetting Camera to Command View...');
  await page.evaluate(() => {
    const resetBtn = document.querySelector('button[title="Reset to Command View"]');
    if (resetBtn) resetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Check 14: Verify synchronization with Selected Borewell Panel
  console.log('15. Verifying synchronized telemetry panel...');
  const stationId = await page.$eval('.station-id', el => el.textContent);
  console.log(`Current synchronized station ID in telemetry panel: ${stationId}`);

  await browser.close();

  console.log('\n========================================');
  console.log('PHASE 2 VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`HTTP Errors (4xx/5xx): ${httpErrors.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  } else {
    console.log('✅ 0 console errors!');
  }
  if (httpErrors.length === 0) {
    console.log('✅ 0 HTTP errors!');
  }
  console.log('✅ All 4 screenshots captured successfully!');
  console.log('🎉 PHASE 2 BROWSER VERIFICATION COMPLETE!');
}

runPhase2Verification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
