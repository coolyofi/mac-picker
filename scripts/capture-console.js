const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE_CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR', err && err.message ? err.message : String(err)));
  page.on('requestfailed', req => console.log('REQUEST_FAILED', req.url(), req.failure() && req.failure().errorText));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('RESPONSE_ERROR', resp.status(), resp.url());
  });

  try {
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    // Wait a bit for worker to post messages and for hydration
    await page.waitForTimeout(3000);

    // Grab body HTML snapshot
    const html = await page.content();
    console.log('HTML_LENGTH', html.length);

    // Check if the UI has non-empty results count
    const countText = await page.$eval('.mp-sidebarMeta .mp-metaValStrong', el => el.textContent).catch(() => null);
    console.log('SIDEBAR_COUNT', countText);

    // Check whether the main grid has skeleton placeholders or real items
    const hasSkeleton = await page.$eval('.mp-grid', g => !!g.querySelector('.pc--skeleton')).catch(() => false);
    const hasReal = await page.$eval('.mp-grid', g => !!g.querySelector('.pc:not(.pc--skeleton)')).catch(() => false);
    const loadingPlaceholder = await page.$eval('.mp-main .mp-loading', el => el?.textContent).catch(() => null);
    console.log('GRID_HAS_SKELETON', hasSkeleton, 'GRID_HAS_REAL', hasReal, 'MAIN_LOADING_TEXT', loadingPlaceholder);

    // List dynamic chunk scripts loaded
    const scripts = await page.$$eval('script[src]', s => s.map(x => x.src).filter(Boolean));
    console.log('SCRIPTS_COUNT', scripts.length);
    scripts.filter(u => u.includes('/_next/static/chunks/')).slice(-10).forEach(s => console.log('CHUNK', s));

    // Check if virtual grid DOM exists
    const hasVGrid = await page.$eval('.mp-virtual-grid', () => true).catch(() => false);
    console.log('HAS_VIRTUAL_GRID_DOM', hasVGrid);

  } catch (err) {
    console.error('SCRIPT_ERROR', err);
  } finally {
    await browser.close();
  }
})();