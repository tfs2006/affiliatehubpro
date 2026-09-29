const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('affiliate-arcade-onboarded', 'true'));
});

test('game loads, scorecard downloads, and milestone updates', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#growthTitle')).toContainText('$100.00');
  await page.locator('#publishBtn').click();
  await page.locator('#endDayBtnTop').click();
  await expect(page.locator('#summaryOverlay')).toHaveClass(/is-open/);
  await page.locator('#summaryShareBtn').click();
  await expect(page.locator('#shareDialog')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('#downloadScore').click();
  expect((await download).suggestedFilename()).toBe('affiliatehub-score.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { state.bestDayCommission = 175; render(); });
  await expect(page.locator('#growthTitle')).toContainText('$500.00');
  await page.reload();
  await expect(page.locator('#growthValue')).toContainText('$175.00');
  expect(errors).toEqual([]);
});

test('challenge round trip and input validation', async ({ page }) => {
  await page.goto('/?challenge=best-day&score=175.25&days=8');
  await expect(page.locator('#friendTarget')).toContainText('$175.25');
  await page.evaluate(() => { state.bestDayCommission = 250; render(); });
  await expect(page.locator('#friendTarget')).toContainText('You beat the target');
  await page.locator('#shareRun').click();
  const url = new URL(await page.locator('#challengeLink').inputValue());
  expect(url.searchParams.get('score')).toBe('250');
  expect(url.searchParams.get('challenge')).toBe('best-day');
  await page.keyboard.press('Escape');
  await page.locator('#dismissChallenge').click();
  await expect(page.locator('#friendChallenge')).toBeHidden();
  expect(new URL(page.url()).searchParams.has('score')).toBe(false);
  await page.goto('/?challenge=best-day&score=Infinity&days=-1');
  await expect(page.locator('#friendChallenge')).toBeHidden();
});

test('reset requires confirmation and copy has manual fallback', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { state.bestDayCommission = 123; render(); });
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#resetBtn').click();
  await expect(page.locator('#growthValue')).toContainText('$123.00');
  await page.locator('#shareRun').click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
  await page.locator('#copyChallenge').click();
  await expect(page.locator('#shareStatus')).toContainText('Select and copy');
  await expect(page.locator('#challengeLink')).toBeFocused();
  await page.keyboard.press('Escape');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#resetBtn').click();
  await expect(page.locator('#growthValue')).toContainText('$0.00');
});

test('mobile CTA, sharing, and layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#jumpToGame').click();
  await expect(page.locator('#mobileGameFlow')).toBeFocused();
  await page.locator('#shareRun').click();
  await expect(page.locator('#shareDialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-share.png' });
});

test('offline challenge navigation and install assets', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  for (const asset of ['/assets/icon-192.png', '/assets/icon-512.png', '/assets/social-card.png']) {
    const response = await page.request.get(asset);
    expect(response.ok()).toBe(true);
  }
  await context.setOffline(true);
  await page.goto('/?challenge=best-day&score=125&days=5');
  await expect(page.locator('#friendTarget')).toContainText('$125.00');
  await expect(page.locator('#shareRun')).toBeVisible();
});
