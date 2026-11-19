// Usage: node scripts/verify/story-ab.mjs <storybook-static A> <storybook-static B> [title filter]
//   [--renders rcx-button --class-index story-classes.json] [--globals 'theme:dark;direction:rtl'] [--jobs 4] [--width 1024]
// Screenshots every matching story in both builds and counts differing pixels. A story that cannot be captured is
// reported and the run goes on. Exits 1 when a story differs or could not be captured, or when none matched. STORY_AB_WAIT=2000 lets addons such as storybook-addon-pseudo-states apply first.
import { cli, openStory, runPool, storyIds } from './lib.mjs';
import { serve } from './serve.mjs';

const { values: opts, positionals } = cli();
const [dirA, dirB, filter = ''] = positionals;

const ids = storyIds(dirA, {
	match: (e) => e.title.toLowerCase().includes(filter.toLowerCase()),
	renders: opts.renders,
	classIndex: opts['class-index'],
});

const [a, b] = await Promise.all([serve(dirA), serve(dirB)]);

const diff = (page, pngA, pngB) =>
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

const shot = async (page, base, id) => {
	await openStory(page, base, id, opts.globals);
	return (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64');
};

const results = await runPool(ids, { jobs: opts.jobs, width: opts.width }, async (page, id) =>
	diff(page, await shot(page, a.url, id), await shot(page, b.url, id)),
);

let identical = 0;
let failed = 0;
let differing = 0;
for (const id of ids) {
	const { value, error } = results.get(id);
	if (error) {
		failed++;
		console.log(`COULD NOT CAPTURE ${id}: ${error}`);
	} else if (value === 0) identical++;
	else {
		differing++;
		console.log(`DIFF ${id}: ${value}`);
	}
}
console.log(`${identical} of ${ids.length} pixel-identical, ${failed} could not be captured`);
if (!ids.length) console.error('No story matched, nothing was compared.');
process.exitCode = !ids.length || failed || differing ? 1 : 0;

a.close();
b.close();
