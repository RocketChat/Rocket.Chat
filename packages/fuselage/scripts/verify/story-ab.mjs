// Usage: node scripts/verify/story-ab.mjs <storybook-static A> <storybook-static B> [title filter]
// Screenshots every matching story in both builds and counts differing pixels. STORY_AB_WAIT=2000 lets addons such as
// storybook-addon-pseudo-states apply first.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { serve } from './serve.mjs';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

const [dirA, dirB, filter = ''] = process.argv.slice(2);

const { entries } = JSON.parse(readFileSync(join(dirA, 'index.json'), 'utf8'));
const ids = Object.values(entries)
	.filter((e) => e.type === 'story' && e.title.toLowerCase().includes(filter.toLowerCase()))
	.map((e) => e.id);

const [a, b] = await Promise.all([serve(dirA), serve(dirB)]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

const shot = async (base, id) => {
	await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
	await page.waitForSelector('#storybook-root > *', { timeout: 15000, state: 'attached' });
	await page.evaluate(() => globalThis.document.fonts.ready);
	// Addons such as storybook-addon-pseudo-states apply after the first render
	await page.waitForTimeout(Number(process.env.STORY_AB_WAIT ?? 0));
	return (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64');
};

const diff = (pngA, pngB) =>
	page.evaluate(
		async ([x, y]) => {
			const load = async (b64) => globalThis.createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
			const [ia, ib] = await Promise.all([load(x), load(y)]);
			if (ia.width !== ib.width || ia.height !== ib.height) return `size ${ia.width}x${ia.height} vs ${ib.width}x${ib.height}`;
			const read = (img) => {
				const c = new globalThis.OffscreenCanvas(img.width, img.height);
				const ctx = c.getContext('2d');
				ctx.drawImage(img, 0, 0);
				return ctx.getImageData(0, 0, img.width, img.height).data;
			};
			const [da, db] = [read(ia), read(ib)];
			let n = 0;
			for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) n++;
			return n;
		},
		[pngA, pngB],
	);

let identical = 0;
let failed = 0;
for (const id of ids) {
	let result;
	try {
		result = await diff(await shot(a.url, id), await shot(b.url, id));
	} catch (error) {
		failed++;
		console.log(`ERROR ${id}: ${error.message.split('\n')[0]}`);
		continue;
	}
	if (result === 0) identical++;
	else console.log(`DIFF ${id}: ${result}`);
}
console.log(`${identical} of ${ids.length} pixel-identical, ${failed} could not be captured`);

await browser.close();
a.close();
b.close();
