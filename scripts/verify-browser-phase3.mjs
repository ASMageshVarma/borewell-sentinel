import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runPhase3Verification() {
  console.log('🚀 Starting Phase 3 Automated Browser Verification (Demo vs Research Mode)...');

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

  // Verify Demo Mode is active initially
  const initialMode = await page.evaluate(() => {
    const activeBtn = document.querySelector('.mode-btn.active');
    return activeBtn ? activeBtn.textContent?.trim() : null;
  });
  console.log(`Initial Mode: ${initialMode}`);

  // Test 1: Switch to RESEARCH MODE
  console.log('2. Switching to RESEARCH MODE...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.mode-btn'));
    const researchBtn = buttons.find((b) => b.textContent?.includes('RESEARCH MODE'));
    if (researchBtn) {
      researchBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Verify Research Mode banner exists
  const researchBannerText = await page.evaluate(() => {
    const banner = document.querySelector('.research-mode-banner');
    return banner ? banner.textContent?.trim() : null;
  });
  console.log(`Research Banner Present: ${!!researchBannerText}`);

  // Capture Screenshot 1: Research Mode Overview
  console.log('Capturing Screenshot 1: Research Mode Overview...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_research_mode_overview.png'),
    fullPage: false,
  });

  // Test 2: Select SENSOR ANOMALY well (TN-SL-04)
  console.log('3. Selecting Sensor Anomaly Well (TN-SL-04)...');
  await page.evaluate(() => {
    const alertButtons = Array.from(document.querySelectorAll('.alert-row'));
    const sensorAlert = alertButtons.find((b) => b.textContent?.includes('TN-SL-04'));
    if (sensorAlert) {
      sensorAlert.click();
    } else {
      const select = document.querySelector('.station-select-native');
      if (select) {
        select.value = 'TN-SL-04';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Screenshot 2: Sensor Anomaly
  console.log('Capturing Screenshot 2: Sensor Anomaly...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_sensor_anomaly.png'),
    fullPage: false,
  });

  // Test 3: Select GROUNDWATER ANOMALY well (TN-NK-05)
  console.log('4. Selecting Groundwater Anomaly Well (TN-NK-05)...');
  await page.evaluate(() => {
    const alertButtons = Array.from(document.querySelectorAll('.alert-row'));
    const gwAlert = alertButtons.find((b) => b.textContent?.includes('TN-NK-05'));
    if (gwAlert) {
      gwAlert.click();
    } else {
      const select = document.querySelector('.station-select-native');
      if (select) {
        select.value = 'TN-NK-05';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Screenshot 3: Groundwater Anomaly
  console.log('Capturing Screenshot 3: Groundwater Anomaly...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_groundwater_anomaly.png'),
    fullPage: false,
  });

  // Test 4: Select UNCERTAIN CASE (TN-MD-12)
  console.log('5. Selecting Uncertain Case Well (TN-MD-12)...');
  await page.evaluate(() => {
    const alertButtons = Array.from(document.querySelectorAll('.alert-row'));
    const uncertainAlert = alertButtons.find((b) => b.textContent?.includes('TN-MD-12'));
    if (uncertainAlert) {
      uncertainAlert.click();
    } else {
      const select = document.querySelector('.station-select-native');
      if (select) {
        select.value = 'TN-MD-12';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Capture Screenshot 4: Uncertain Case
  console.log('Capturing Screenshot 4: Uncertain Case...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_uncertain_case.png'),
    fullPage: false,
  });

  // Test 5: 3D Twin Anomaly View
  console.log('6. Focusing on 3D Digital Twin Anomaly Case...');
  // Select TN-NK-05 for striking groundwater drawdown in 3D
  await page.evaluate(() => {
    const select = document.querySelector('.station-select-native');
    if (select) {
      select.value = 'TN-NK-05';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Switch twin view mode to Subsurface
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.view-tab-btn'));
    const subBtn = buttons.find((b) => b.textContent?.includes('Subsurface'));
    if (subBtn) {
      subBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Capture Screenshot 5: 3D Twin Anomaly Case
  console.log('Capturing Screenshot 5: 3D Anomaly Twin...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_3d_anomaly_twin.png'),
    fullPage: false,
  });

  // Test 6: Open Explainability Modal ("WHY?")
  console.log('7. Triggering Explainability Modal (WHY?)...');
  await page.evaluate(() => {
    const whyBtns = Array.from(document.querySelectorAll('.why-chip-btn, .explain-btn-top'));
    if (whyBtns.length > 0) {
      whyBtns[0].click();
    }
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Verify modal is open
  const isModalVisible = await page.evaluate(() => {
    const modal = document.querySelector('.modal-backdrop');
    return !!modal;
  });
  console.log(`Explainability Modal Open: ${isModalVisible}`);

  // Capture Screenshot 6: Explainability Panel
  console.log('Capturing Screenshot 6: Explainability Panel...');
  await page.screenshot({
    path: path.join(process.cwd(), 'public', 'phase3_explainability_panel.png'),
    fullPage: false,
  });

  // Close modal and verify returning to Demo Mode
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log('8. Switching back to DEMO MODE to ensure backward compatibility...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.mode-btn'));
    const demoBtn = buttons.find((b) => b.textContent?.includes('DEMO MODE'));
    if (demoBtn) {
      demoBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 1000));

  const finalMode = await page.evaluate(() => {
    const activeBtn = document.querySelector('.mode-btn.active');
    return activeBtn ? activeBtn.textContent?.trim() : null;
  });
  console.log(`Final Mode: ${finalMode}`);

  await browser.close();

  console.log('\n================ VERIFICATION AUDIT ================');
  console.log(`Console Errors count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  }
  console.log(`HTTP Errors count: ${httpErrors.length}`);
  if (httpErrors.length > 0) {
    console.error('HTTP Errors:', httpErrors);
  }

  const allPassed = consoleErrors.length === 0 && httpErrors.length === 0;
  console.log(`Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ CHECKS FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

runPhase3Verification().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
