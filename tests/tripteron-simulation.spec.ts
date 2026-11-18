import { test, expect, type Page, type FrameLocator } from '@playwright/test';
import sharp from 'sharp';
import { createKinematics } from '../src/scripts/tripteron-kinematics';

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
    await expect(page.locator('#follow')).toBeChecked();
    const start = await page.locator('#simulation').getAttribute('data-frame');
    await expect.poll(() => page.locator('#simulation').getAttribute('data-frame')).not.toBe(start);
    await page.locator('#play').click();
    for (const assembly of ['pair', 'single']) {
      await page.locator(`input[name="assembly"][value="${assembly}"]`).check();
      for (const motion of ['tour', 'sweep', 'line']) {
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

test('default camera frames the carriages closely throughout the tour', async ({ page }, testInfo) => {
  const manifest = await (await page.request.get('/media/tripteron/simulation/manifest.json?v=clearance-manual-v4')).json();
  const clip = manifest.clips.find(c => c.id === 'tour');
  const frames = new Set<number>([0, clip.frames - 1]);
  for (const phase of clip.phases) {
    for (let axis = 0; axis < 3; axis++) {
      for (const sign of [-1, 1]) {
        let best = phase.start_frame;
        for (let frame = phase.start_frame; frame <= phase.end_frame; frame++) {
          if (sign * clip.poses_mm[frame][axis] > sign * clip.poses_mm[best][axis]) best = frame;
        }
        frames.add(best);
      }
    }
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/projects/tripteron/');
    const frame = page.frameLocator('article #simulation iframe');
    const simulation = frame.locator('#simulation');
    await expect(simulation).toHaveAttribute('data-state', 'ready');
    const distance = Number(await simulation.getAttribute('data-camera-distance'));
    // The previous swept-box framing was 3.52 m from the moving pair.
    expect(distance).toBeLessThan(2.9);
    expect(distance).toBeGreaterThan(2);
    for (const index of frames) {
      await scrub(frame, index);
      await checkModel(await frame.locator('#scene').screenshot());
      expect(Number(await simulation.getAttribute('data-camera-distance'))).toBe(distance);
    }
    await scrub(frame, 0);
    await page.screenshot({ path: testInfo.outputPath(`close-carriages-${viewport.width}.png`) });
    await frame.locator('#follow').uncheck();
    expect(Number(await simulation.getAttribute('data-camera-distance'))).toBeGreaterThan(distance * 1.4);
    await frame.locator('#follow').check();
    expect(Number(await simulation.getAttribute('data-camera-distance'))).toBeCloseTo(distance, 3);
  }
});

test('simulation survives presentation navigation', async ({ page }) => {
  await page.goto('/projects/tripteron/?present=1#overview');
  await expect(page.locator('#presentation-section option')).toHaveCount(10);
  await page.selectOption('#presentation-section', { label: '2. CAD Motion Simulation' });
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
  const manifest = await (await page.request.get('/media/tripteron/simulation/manifest.json?v=clearance-manual-v4')).json();
  expect(manifest.rail_length_mm).toBe(2000);
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
    const p = (robot ? clip.poses_b_mm : clip.poses_mm)[sideFrame];
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

test('tour alternates matching and opposing motion without stretching a rigid bar', async ({ page }, testInfo) => {
  const manifest = await (await page.request.get('/media/tripteron/simulation/manifest.json?v=clearance-manual-v4')).json();
  const clip = manifest.clips.find(c => c.id === 'tour');
  expect(clip.phases.map(p => p.coordination)).toEqual(['together', 'opposite']);
  for (const id of ['sweep', 'single-sweep']) {
    const sweep = manifest.clips.find(c => c.id === id);
    expect(sweep.poses_mm.every(p => p[1] === 0)).toBe(true);
  }
  await page.goto('/projects/tripteron/simulation/');
  await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'ready');
  for (const phase of clip.phases) {
    for (const fraction of [.2, .6, .8]) {
      const frame = Math.floor(phase.start_frame+(phase.end_frame-phase.start_frame)*fraction);
      await scrub(page, frame);
      await expect(page.locator('#simulation')).toHaveAttribute('data-coordination', phase.coordination);
      await expect(page.locator('#simulation')).toHaveAttribute('data-connector', phase.connector);
      const [a, b] = JSON.parse((await page.locator('#simulation').getAttribute('data-endpoints'))!);
      const sign = phase.coordination === 'together' ? 1 : -1;
      a.forEach((v, axis) => expect(b[axis]-(axis === 2 ? 1 : 0)).toBeCloseTo(sign*v, 6));
      await checkModel(await page.locator('#scene').screenshot());
      await page.locator('input[name="plot-robot"][value="1"]').check();
      const p = clip.poses_b_mm[frame];
      const expected = manifest.carriage_matrix.map(row => row.reduce((sum,v,i) => sum+v*p[i],0));
      const actual = (await page.locator('#carriage-plot').getAttribute('data-values'))!.split(',').map(Number);
      actual.forEach((v,i) => expect(v).toBeCloseTo(expected[i],2));
      (await page.locator('#analysis').getAttribute('data-pose'))!.split(',').map(Number).forEach((v,i) => expect(v).toBeCloseTo(p[i],6));
    }
    await page.screenshot({ path: testInfo.outputPath(`${phase.coordination}.png`) });
  }
});

test('project opens with a centered, width-limited simulation in the first viewport', async ({ page }, testInfo) => {
  for (const viewport of [{width:1920,height:1080}, {width:1440,height:900}, {width:900,height:900}, {width:390,height:844}]) {
    await page.setViewportSize(viewport);
    await page.goto('/projects/tripteron/');
    const frame = page.frameLocator('article #simulation iframe');
    await expect(frame.locator('#simulation')).toHaveAttribute('data-state', 'ready');
    await expect(frame.locator('#follow')).toBeChecked();
    await checkModel(await frame.locator('#scene').screenshot());
    const box = await page.locator('article #simulation iframe').boundingBox();
    expect(box!.y).toBeLessThan(200);
    const gutters = viewport.width <= 639 ? 32 : 48;
    expect(box!.width).toBe(Math.min(1200, viewport.width-gutters));
    expect(box!.x).toBeCloseTo((viewport.width-box!.width)/2, 1);
    const summary = await page.locator('#project-summary').boundingBox();
    expect(summary!.y).toBeLessThan(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
    expect(await frame.locator('body').evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await page.screenshot({path:testInfo.outputPath(`hero-${viewport.width}.png`)});
  }
});

test('browser IK matches exported CAD transforms and rejects the reported bad poses', async ({ request }) => {
  const manifest = await (await request.get('/media/tripteron/simulation/manifest.json?v=clearance-manual-v4')).json();
  expect(manifest.schema).toBe(4);
  expect(manifest.validation.omitted_fixed_bodies).toContain(1);
  expect(manifest.validation.omitted_fixed_bodies).toContain(11);
  const kinematics = createKinematics(manifest);
  for (const p of [[-122.7, 0, -212.4], [-162.1, 0, -145.9]]) {
    expect(kinematics.segmentReason(p, p)).not.toBe('');
    expect(kinematics.segmentReason([0,0,0], p)).not.toBe('');
  }
  for (const clip of manifest.clips) {
    const buffer = await (await request.get('/media/tripteron/simulation/' + clip.file + '?v=clearance-manual-v4')).body();
    const matrices = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    for (const path of [clip.poses_mm, clip.poses_b_mm]) {
      for (let i = 1; i < path.length; i++) expect(kinematics.segmentReason(path[i-1], path[i])).toBe('');
    }
    for (let frame = 0; frame < clip.frames; frame += 73) {
      for (let robot = 0; robot < 2; robot++) {
        const pose = (robot ? clip.poses_b_mm : clip.poses_mm)[frame];
        const computed = kinematics.matrices(pose);
        computed.forEach((matrix, group) => matrix.elements.forEach((value, i) => {
          const index = ((frame * 2 + robot) * manifest.groups.length + group) * 16 + i;
          expect(Math.abs(value - matrices[index])).toBeLessThan(2e-5);
        }));
      }
    }
  }
  let current = [0, 0, 0];
  for (let i = 0; i < 300; i++) {
    const target = [Math.sin(i * 1.7) * 500, Math.cos(i * .7) * 2500, Math.sin(i * .3) * 500];
    const moved = kinematics.move(current, target);
    expect(kinematics.segmentReason(current, moved.point)).toBe('');
    expect(moved.point.every(Number.isFinite)).toBe(true);
    current = moved.point;
  }
  expect(kinematics.move(current, [NaN, 0, 0]).point).toEqual(current);
});

for (const viewport of [{ width:1440, height:900 }, { width:390, height:844 }]) {
  test(`manual XYZ control, limits and mode transitions at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/projects/tripteron/simulation/');
    await expect(page.locator('#simulation')).toHaveAttribute('data-state', 'ready');
    await scrub(page, 120);
    await page.selectOption('#motion', 'manual');
    await expect(page.locator('#manual-controls')).toBeVisible();
    await expect(page.locator('#play')).toBeDisabled();
    const pose = async () => JSON.parse((await page.locator('#simulation').getAttribute('data-manual-pose'))!);
    const type = async (axis: string, value: number) => {
      await page.locator(`#manual-${axis}-value`).fill(String(value));
      await page.locator(`#manual-${axis}-value`).press('Tab');
    };
    const reference = await page.locator('#scene').screenshot();
    for (const [axis, value] of [['X',30], ['Y',120], ['Z',20]] as const) await type(axis, value);
    (await pose())[0].forEach((v, i) => expect(v).toBeCloseTo([30,120,20][i],3));
    await changed(reference, await page.locator('#scene').screenshot());
    await expect(page.locator('#simulation')).toHaveAttribute('data-connector', 'none');
    await page.locator('input[name="manual-robot"][value="1"]').check();
    await type('X', -25);
    expect((await pose())[1][0]).toBe(-25);
    expect((await pose())[0]).toEqual([30,120,20]);
    await expect(page.locator('#analysis')).toHaveAttribute('data-robot', '1');
    await type('Z', -5000);
    await expect(page.locator('#manual-status')).toHaveAttribute('data-limited', '');
    expect((await pose())[1][2]).toBeGreaterThan(-100);
    await page.locator('#manual-home').click();
    (await pose())[1].forEach(v => expect(v).toBeCloseTo(0,3));
    await page.locator('input[name="assembly"][value="single"]').check();
    await expect(page.locator('input[name="manual-robot"][value="1"]')).toBeDisabled();
    await page.locator('#manual-X').focus();
    await page.locator('#manual-X').press('ArrowRight');
    expect((await pose())[0][0]).toBeGreaterThan(0);
    await type('Y', 500);
    await type('Z', 40);
    await checkModel(await page.locator('#scene').screenshot());
    await page.screenshot({ path:testInfo.outputPath(`manual-${viewport.width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await page.selectOption('#motion', 'tour');
    await expect(page.locator('#simulation')).toHaveAttribute('data-motion', 'single-tour');
    await expect(page.locator('#manual-controls')).toBeHidden();
    await expect(page.locator('#play')).toBeEnabled();
    await page.locator('#play').click();
    await expect.poll(async () => Number(await page.locator('#simulation').getAttribute('data-frame'))).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    await page.goto('/projects/tripteron/');
    const embedded = page.frameLocator('article #simulation iframe');
    await expect(embedded.locator('#simulation')).toHaveAttribute('data-state', 'ready');
    await embedded.locator('#motion').selectOption('manual');
    const scene = await embedded.locator('#viewport').boundingBox();
    const workbench = await embedded.locator('.workbench').boundingBox();
    expect(scene!.y + scene!.height).toBeLessThanOrEqual(workbench!.y + workbench!.height + 1);
    await checkModel(await embedded.locator('#scene').screenshot());
    await page.screenshot({ path:testInfo.outputPath(`manual-embedded-${viewport.width}.png`) });
  });
}
