const { chromium } = require('playwright-chromium');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: 'http://localhost:4000' });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto('/login.html');
    await page.waitForSelector('#login-form');

    await page.selectOption('#lang-select-login', 'UZ');
    const uzButton = await page.textContent('#login-form button[type="submit"]');
    if (!uzButton.toLowerCase().includes('kir')) throw new Error('UZ translation missing on login');

    await page.selectOption('#lang-select-login', 'EN');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await Promise.all([
      page.waitForNavigation({ url: '**/app.html' }),
      page.click('#login-form button[type="submit"]'),
    ]);

    await page.waitForSelector('#section-dashboard');
    await page.selectOption('#lang-select-app', 'JP');
    const jpNav = await page.textContent('.nav-item.active span:nth-of-type(2)');
    if (!jpNav.includes('ダッシュボード')) throw new Error('JP translation missing on dashboard');
    await page.selectOption('#lang-select-app', 'EN');

    // Go to products and create one
    await page.click('.nav-item[data-section="products"]');
    await page.waitForSelector('#section-products', { state: 'visible' });
    await page.fill('#product-name', 'Test Widget');
    await page.fill('#product-category', 'Tools');
    await page.fill('#product-price', '12345');
    await page.fill('#product-stock', '10');
    await Promise.all([
      page.waitForSelector('tbody#products-body tr'),
      page.click('#product-submit'),
    ]);

    const priceCell = await page.textContent('tbody#products-body tr td:nth-child(3)');
    if (!priceCell.includes('so‘m')) throw new Error('Currency not displayed as so‘m');

    // Movement IN
    await page.click('.nav-item[data-section="movements"]');
    await page.waitForSelector('#section-movements', { state: 'visible' });
    await page.selectOption('#movement-product', { index: 0 });
    await page.selectOption('#movement-type', 'IN');
    await page.fill('#movement-quantity', '3');
    await page.click('#movement-form button[type="submit"]');

    // Export CSV
    await page.click('.nav-item[data-section="export"]');
    await page.waitForSelector('#section-export', { state: 'visible' });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.click('#export-btn'),
    ]);
    await download.path();

    if (consoleErrors.length) {
      throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);
    }

    console.log('UI test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('UI test failed', err);
    await browser.close();
    process.exit(1);
  }
})();
