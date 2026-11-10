// Usage: node scripts/verify/story-computed.mjs <storybook-static A> <storybook-static B> [story id filter] [max elements]
//   [--renders rcx-button --class-index story-classes.json] [--globals 'theme:dark;direction:rtl'] [--jobs 4] [--width 1024]
// Diffs tag, rcx classes and computed styles (incl. ::before/::after) of everything each story renders in <body>, portals
// included, in two Storybook builds. Elements pair by their rcx path, so a changed wrapper does not misalign the rest.
// Lists up to `max` differing elements per story (6). STORY_AB_WAIT=2000 lets addons such as pseudo-states apply first.
import { cli, openStory, runPool, storyIds } from './lib.mjs';
import { serve } from './serve.mjs';

const { values: opts, positionals } = cli();
const [dirA, dirB, filter = '', maxArg = '6'] = positionals;
const max = Number.parseInt(maxArg, 10) > 0 ? Number.parseInt(maxArg, 10) : 6;
const ids = storyIds(dirA, { match: (e) => e.id.includes(filter), renders: opts.renders, classIndex: opts['class-index'] });

const [serverA, serverB] = await Promise.all([serve(dirA), serve(dirB)]);

// Path = first rcx class (and nth among same-class siblings) of each rcx ancestor, then the element itself.
const snapshot = async (page, base, id) => {
	await openStory(page, base, id, opts.globals);
	return page.evaluate(() => {
		const rcxOf = (el) => [...el.classList].find((c) => c.startsWith('rcx-') && !c.startsWith('rcx-css-'));
		const label = (el) => {
			const own = rcxOf(el);
			const same = [...el.parentElement.children].filter((s) => (own ? rcxOf(s) === own : !rcxOf(s) && s.tagName === el.tagName));
			return `${own ?? el.tagName.toLowerCase()}[${same.indexOf(el)}]`;
		};
		const seen = new Map();
		const out = {};
		const read = (style) => Object.fromEntries([...style].map((p) => [p, style.getPropertyValue(p)]));
		for (const el of globalThis.document.body.querySelectorAll('*')) {
			if (['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT'].includes(el.tagName)) continue;
			const chain = [];
			for (let n = el.parentElement; n && n !== globalThis.document.body; n = n.parentElement) if (rcxOf(n)) chain.unshift(label(n));
			let key = [...chain, label(el)].join(' > ');
			const count = seen.get(key) ?? 0;
			seen.set(key, count + 1);
			if (count) key += `#${count}`;
			out[key] = {
				tag: el.tagName,
				rcx: [...el.classList].filter((c) => c.startsWith('rcx-') && !c.startsWith('rcx-css-')).join(' '),
				style: read(globalThis.getComputedStyle(el)),
			};
			for (const pseudo of ['::before', '::after']) {
				const style = globalThis.getComputedStyle(el, pseudo);
				if (style.content !== 'none' && style.content !== 'normal') out[key + pseudo] = { tag: pseudo, rcx: '', style: read(style) };
			}
		}
		return out;
	});
};

const results = await runPool(ids, { jobs: opts.jobs, width: opts.width }, async (page, id) => [
	await snapshot(page, serverA.url, id),
	await snapshot(page, serverB.url, id),
]);

let identical = 0;
let failed = 0;
for (const id of ids) {
	const { value, error } = results.get(id);
	if (error) {
		failed++;
		console.log(`COULD NOT CAPTURE ${id}: ${error}`);
		continue;
	}
	const [a, b] = value;
	const lines = [];
	const removed = Object.keys(a).filter((k) => !(k in b));
	const added = Object.keys(b).filter((k) => !(k in a));
	for (const k of removed.slice(0, max)) lines.push(`   only in A: ${k}`);
	for (const k of added.slice(0, max)) lines.push(`   only in B: ${k}`);
	let differing = 0;
	for (const key of Object.keys(a).filter((k) => k in b)) {
		const [x, y] = [a[key], b[key]];
		const props = Object.keys(x.style).filter((p) => x.style[p] !== y.style[p] && !/origin$/.test(p));
		if (x.tag === y.tag && x.rcx === y.rcx && !props.length) continue;
		differing++;
		if (differing > max) continue;
		lines.push(`   ${key} ${x.tag}.${x.rcx}${x.rcx !== y.rcx ? ` -> rcx "${y.rcx}"` : ''}`);
		for (const p of props.slice(0, 8)) lines.push(`      ${p}: ${x.style[p]} -> ${y.style[p]}`);
	}
	if (differing > max) lines.push(`   … ${differing - max} more differing elements`);
	if (removed.length > max || added.length > max) lines.push(`   … ${removed.length} only in A, ${added.length} only in B`);
	if (lines.length) console.log(`DIFF ${id}\n${lines.join('\n')}`);
	else identical++;
}
console.log(`${identical} of ${ids.length} stories with identical computed styles, ${failed} could not be captured`);

serverA.close();
serverB.close();
