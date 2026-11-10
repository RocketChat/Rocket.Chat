// Shared by the Storybook verification scripts: story selection, page readiness and a crash-tolerant page pool.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

export const cli = (options = {}) =>
	parseArgs({
		allowPositionals: true,
		options: {
			'globals': { type: 'string' },
			'renders': { type: 'string' },
			'class-index': { type: 'string' },
			'jobs': { type: 'string', default: '4' },
			'width': { type: 'string', default: '1024' },
			...options,
		},
	});

export const storyIds = (dir, { match = () => true, renders, classIndex } = {}) => {
	const { entries } = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
	let index;
	if (renders) {
		if (!classIndex) throw new Error('--renders needs --class-index <story-classes.json>');
		index = JSON.parse(readFileSync(classIndex, 'utf8'));
	}
	return Object.values(entries)
		.filter((e) => e.type === 'story' && match(e) && (!index || index[e.id]?.includes(renders)))
		.map((e) => e.id);
};

const FREEZE = '*,*::before,*::after{transition:none!important;animation:none!important}';

const open = async (width) => {
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width, height: 768 } });
	page.setDefaultTimeout(20000);
	await page.addInitScript((css) => {
		globalThis.document.addEventListener('DOMContentLoaded', () => {
			const style = globalThis.document.createElement('style');
			style.textContent = css;
			globalThis.document.head.append(style);
		});
	}, FREEZE);
	return { browser, page };
};

// Loads a story and waits until it is rendered and still; STORY_AB_WAIT adds time for addons such as storybook-addon-pseudo-states.
export const openStory = async (page, base, id, globals) => {
	const query = globals ? `&globals=${encodeURIComponent(globals)}` : '';
	await page.goto(`${base}/iframe.html?id=${id}&viewMode=story${query}`);
	await page.waitForSelector('#storybook-root > *', { state: 'attached' });
	await page.evaluate(async () => {
		await globalThis.document.fonts.ready;
		await new Promise((done) => globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(done)));
		// Effects and addons keep touching the DOM after the first paint: wait for 200ms without a mutation, 5s at most.
		await new Promise((done) => {
			let quiet;
			let cap;
			let observer;
			const finish = () => {
				observer.disconnect();
				clearTimeout(quiet);
				clearTimeout(cap);
				done();
			};
			const settle = () => {
				clearTimeout(quiet);
				quiet = setTimeout(finish, 200);
			};
			observer = new globalThis.MutationObserver(settle);
			cap = setTimeout(finish, 5000);
			settle();
			observer.observe(globalThis.document, { subtree: true, childList: true, attributes: true, characterData: true });
		});
	});
	await page.waitForTimeout(Number(process.env.STORY_AB_WAIT ?? 0));
};

// Runs fn(page, id) over the ids on `jobs` pages. A failure only costs that story: the browser is relaunched and the run goes on.
// If a browser cannot be relaunched its worker stops, and ids nobody picked up are reported as errors.
export const runPool = async (ids, { jobs, width }, fn) => {
	const results = new Map();
	let next = 0;
	const worker = async () => {
		let session = await open(Number(width));
		while (next < ids.length) {
			const id = ids[next++];
			try {
				results.set(id, { value: await fn(session.page, id) });
			} catch (error) {
				results.set(id, { error: error.message.split('\n')[0] });
				await session.browser.close().catch(() => undefined);
				try {
					session = await open(Number(width));
				} catch {
					return;
				}
			}
		}
		await session.browser.close().catch(() => undefined);
	};
	const workers = Math.min(Math.max(1, Math.floor(Number(jobs)) || 1), ids.length);
	await Promise.all(Array.from({ length: workers }, worker));
	for (const id of ids) if (!results.has(id)) results.set(id, { error: 'no browser could be started for this story' });
	return results;
};
