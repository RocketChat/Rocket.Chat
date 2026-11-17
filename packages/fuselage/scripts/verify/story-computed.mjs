// Usage: node scripts/verify/story-computed.mjs <storybook-static A> <storybook-static B> [story id filter] [max elements]
// Diffs tag, rcx classes and computed styles of every element each story renders in two Storybook builds, over every
// story whose id contains the filter (all of them without one). Lists up to `max` differing elements per story (6).
// STORY_AB_WAIT=2000 lets addons such as storybook-addon-pseudo-states apply first.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { serve } from './serve.mjs';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

const [dirA, dirB, filter = '', maxArg = '6'] = process.argv.slice(2);
const max = Number.parseInt(maxArg, 10) > 0 ? Number.parseInt(maxArg, 10) : 6;

const { entries } = JSON.parse(readFileSync(join(dirA, 'index.json'), 'utf8'));
const ids = Object.values(entries)
	.filter((e) => e.type === 'story' && e.id.includes(filter))
	.map((e) => e.id);

const [serverA, serverB] = await Promise.all([serve(dirA), serve(dirB)]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

const snapshot = async (base, id) => {
	await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
	await page.waitForSelector('#storybook-root > *', { timeout: 15000, state: 'attached' });
	await page.evaluate(() => globalThis.document.fonts.ready);
	await page.waitForTimeout(Number(process.env.STORY_AB_WAIT ?? 0));
	return page.evaluate(() =>
		[...globalThis.document.querySelectorAll('#storybook-root *')].map((el) => {
			const style = globalThis.getComputedStyle(el);
			return {
				tag: el.tagName,
				rcx: [...el.classList].filter((c) => c.startsWith('rcx-') && !c.startsWith('rcx-css-')).join(' '),
				style: Object.fromEntries([...style].map((p) => [p, style.getPropertyValue(p)])),
			};
		}),
	);
};

let identical = 0;
let failed = 0;
for (const id of ids) {
	let a;
	let b;
	try {
		[a, b] = [await snapshot(serverA.url, id), await snapshot(serverB.url, id)];
	} catch (error) {
		failed++;
		console.log(`ERROR ${id}: ${error.message.split('\n')[0]}`);
		continue;
	}
	const lines = [];
	// Elements pair by document order, so after a count mismatch every later pair would be misaligned.
	if (a.length !== b.length) {
		lines.push(`   element count ${a.length} vs ${b.length}`);
	} else {
		let differing = 0;
		for (let i = 0; i < a.length; i++) {
			const [x, y] = [a[i], b[i]];
			const props = Object.keys(x.style).filter((p) => x.style[p] !== y.style[p] && !/origin$/.test(p));
			if (x.tag === y.tag && x.rcx === y.rcx && !props.length) continue;
			differing++;
			if (differing > max) continue;
			lines.push(`   #${i} ${x.tag}.${x.rcx}${x.rcx !== y.rcx ? ` -> rcx "${y.rcx}"` : ''}`);
			for (const p of props.slice(0, 8)) lines.push(`      ${p}: ${x.style[p]} -> ${y.style[p]}`);
		}
		if (differing > max) lines.push(`   … ${differing - max} more differing elements`);
	}
	if (lines.length) console.log(`DIFF ${id}\n${lines.join('\n')}`);
	else identical++;
}
console.log(`${identical} of ${ids.length} stories with identical computed styles, ${failed} could not be captured`);

await browser.close();
serverA.close();
serverB.close();
