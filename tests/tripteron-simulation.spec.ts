import { test, expect, type Page, type FrameLocator } from '@playwright/test';
import sharp from 'sharp';

async function pixels(buffer: Buffer) {
  return sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function checkModel(buffer: Buffer) {
  const { data, info } = await pixels(buffer);
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 145 && data[i + 1] < 175 && data[i + 2] < 185) dark++;
  }
  expect(dark).toBeGreaterThan(400);
  expect(dark / (info.width * info.height)).toBeLessThan(.6);
}

async function changed(a: Buffer, b: Buffer) {
  const one = await pixels(a), two = await pixels(b);
  expect(one.info).toEqual(two.info);
  let different = 0;
  for (let i = 0; i < one.data.length; i += 4) {
    if (Math.abs(one.data[i] - two.data[i]) + Math.abs(one.data[i + 1] - two.data[i + 1]) + Math.abs(one.data[i + 2] - two.data[i + 2]) > 35) different++;
  }
  expect(different).toBeGreaterThan(150);
}

async function scrub(scope: Page | FrameLocator, frame: number) {
  await scope.locator('#timeline').evaluate((el: HTMLInputElement, value) => {
    el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, frame);
  await expect(scope.locator('#simulation')).toHaveAttribute('data-frame', String(frame));
  await scope.locator('#scene').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`actual CAD motion and controls at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('/projects/tripteron/simulation/');
    await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('#motion')).toHaveValue('tour');
    const start = await page.locator('#simulation').getAttribute('data-frame');
    await expect.poll(() => page.locator('#simulation').getAttribute('data-frame')).not.toBe(start);
    await page.locator('#play').click();
    for (const assembly of ['pair', 'single']) {
      await page.locator(`input[name="assembly"][value="${assembly}"]`).check();
      for (const motion of ['tour', 'sweep', 'lift', 'line']) {
        await page.selectOption('#motion', motion);
        await expect(page.locator('#simulation')).toHaveAttribute('data-motion', assembly === 'pair' ? motion : 'single-' + motion);
        await scrub(page, 0);
        const reference = await page.locator('#scene').screenshot();
        await checkModel(reference);
        await scrub(page, 120);
        const moved = await page.locator('#scene').screenshot();
        await checkModel(moved);
        await changed(reference, moved);
        await page.screenshot({ path: testInfo.outputPath(`${assembly}-${motion}.png`) });
        const last = Number(await page.locator('#timeline').getAttribute('max'));
        await scrub(page, last);
        await expect(page.locator('#position')).toContainText('X 0.0   Y 0.0   Z 0.0');
      }
    }
    await page.locator('#path').uncheck();
    await page.selectOption('#camera', 'side');
    await page.locator('#fit').click();
    const side = await page.locator('#scene').screenshot();
    await page.selectOption('#camera', 'front');
    await page.waitForTimeout(300);
    await changed(side, await page.locator('#scene').screenshot());
    await page.locator('#follow').check();
    await checkModel(await page.locator('#scene').screenshot());
    await page.locator('#plots').uncheck();
    await expect(page.locator('#analysis')).toBeHidden();
    await page.locator('#plots').check();
    await page.selectOption('#speed', '2');
    await page.locator('#play').click();
    await expect.poll(async () => Number(await page.locator('#simulation').getAttribute('data-frame'))).toBeGreaterThan(0);
    await page.locator('#play').click();
    const canvas = await page.locator('#scene').boundingBox();
    await page.mouse.move(canvas!.x + canvas!.width / 2, canvas!.y + canvas!.height / 2);
    await page.mouse.down(); await page.mouse.move(canvas!.x + canvas!.width / 2 + 80, canvas!.y + canvas!.height / 2 + 40, { steps: 8 }); await page.mouse.up();
    await page.locator('#fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('simulation');
    await page.evaluate(() => document.exitFullscreen());
    await page.locator('#model-details summary').click();
    await expect(page.locator('#ranges')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    const controls = await page.locator('header, .toolbar, .playback, summary').evaluateAll(nodes => nodes.map(n => {
      const r = n.getBoundingClientRect(); return { left: r.left, right: r.right };
    }));
    for (const c of controls) { expect(c.left).toBeGreaterThanOrEqual(0); expect(c.right).toBeLessThanOrEqual(viewport.width); }
    expect(errors).toEqual([]);
  });
}

test('reduced motion and missing asset states', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto((process.env.PORTFOLIO_URL || 'http://127.0.0.1:4322') + '/projects/tripteron/simulation/');
  await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#play')).toHaveAttribute('data-paused', '');
  await page.waitForTimeout(250);
  await expect(page.locator('#simulation')).toHaveAttribute('data-frame', '0');
  await page.route('**/assembly.glb*', route => route.abort());
  await page.reload();
  await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#retry')).toBeVisible();
  await context.close();
});

test('simulation survives presentation navigation', async ({ page }) => {
  await page.goto('/projects/tripteron/?present=1#overview');
  await expect(page.locator('#presentation-section option')).toHaveCount(10);
  await page.selectOption('#presentation-section', { label: '3. CAD Motion Simulation' });
  const frame = page.frameLocator('#presentation-stage iframe');
  await expect(frame.locator('#simulation')).toHaveAttribute('data-state', 'ready');
  await scrub(frame, 120);
  await checkModel(await frame.locator('#scene').screenshot());
  await page.locator('#presentation-next').click();
  await page.locator('#presentation-previous').click();
  await expect(frame.locator('#simulation')).toHaveAttribute('data-state', 'ready');
  await scrub(frame, 180);
  await checkModel(await frame.locator('#scene').screenshot());
  await page.screenshot({ path: '/tmp/tripteron-presentation-simulation.png' });
  await page.locator('#presentation-exit').click();
  await expect(page).toHaveURL(/#overview$/);
  await expect(page.locator('article #simulation iframe')).toHaveCount(1);
});

test('plots match the displayed pose, bounds and mirrored robot', async ({ page }, testInfo) => {
  const manifest = await (await page.request.get('/media/tripteron/simulation/manifest.json?v=rail4000-v2')).json();
  expect(manifest.rail_length_mm).toBe(4000);
  expect(manifest.source_rail_length_mm).toBe(700);
  await page.goto('/projects/tripteron/simulation/');
  await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'ready');
  await page.locator('#play').click();
  const clip = manifest.clips.find(c => c.id === 'tour');
  const maxY = clip.poses_mm.reduce((best, p, i, all) => p[1] > all[best][1] ? i : best, 0);
  const filled = () => page.locator('#workspace-plot').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] === 144 && data[i+1] === 197 && data[i+2] === 197) count++;
    return count;
  });
  await scrub(page, 0);
  const middleArea = await filled();
  await scrub(page, maxY);
  expect(await filled()).toBeLessThan(middleArea);
  await expect(page.locator('#analysis')).toHaveAttribute('data-frame', String(maxY));
  await page.screenshot({ path: testInfo.outputPath('upper-rail-limit.png') });
  const sideFrame = clip.poses_mm.reduce((best, p, i, all) => p[0] > all[best][0] ? i : best, 0);
  await scrub(page, sideFrame);
  for (const robot of [0, 1]) {
    await page.locator(`input[name="plot-robot"][value="${robot}"]`).check();
    const p = clip.poses_mm[sideFrame].map((v, axis) => robot && axis !== 1 ? -v : v);
    const expected = manifest.carriage_matrix.map(row => row.reduce((sum, v, axis) => sum+v*p[axis], 0));
    const actual = (await page.locator('#carriage-plot').getAttribute('data-values'))!.split(',').map(Number);
    actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 2));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#analysis').scrollIntoViewIfNeeded();
  await page.locator('#play').click();
  const frame = await page.locator('#analysis').getAttribute('data-frame');
  await expect.poll(() => page.locator('#analysis').getAttribute('data-frame')).not.toBe(frame);
  await page.locator('#play').click();
  await page.screenshot({ path: testInfo.outputPath('mobile-plots.png') });
});
