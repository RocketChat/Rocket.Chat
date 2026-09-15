'use strict';

/**
 * Builds the (spec, source) frame for the mutation-testing scope experiment.
 * Run from apps/meteor.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
// The mocha config is the frame, and the script resolves it from its own location rather than the caller's.
// eslint-disable-next-line import-x/no-dynamic-require
const cfg = require(path.join(ROOT, '.mocharc.js'));

const specs = (() => {
	const files = new Set();
	for (const p of cfg.spec) for (const f of fs.globSync(p, { cwd: ROOT })) files.add(f);
	const ignored = new Set();
	for (const p of cfg.ignore || []) for (const f of fs.globSync(p, { cwd: ROOT })) ignored.add(f);
	return [...files].filter((f) => !ignored.has(f)).sort();
})();

const EXTS = ['.ts', '.tsx', '.js', '.jsx'];

const resolveModule = (fromFile, request) => {
	const base = path.resolve(path.dirname(path.join(ROOT, fromFile)), request);
	for (const ext of ['', ...EXTS]) {
		const candidate = base + ext;
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.relative(ROOT, candidate);
	}
	for (const ext of EXTS) {
		const candidate = path.join(base, `index${ext}`);
		if (fs.existsSync(candidate)) return path.relative(ROOT, candidate);
	}
	return null;
};

const isTestFile = (f) => /\.(spec|tests?)\.(ts|tsx|js|jsx)$/.test(f);
const isHelper = (f) => /(^|\/)(mocks?|fixtures?|helpers?|stubs?)(\/|\.)/i.test(f);

const pairs = [];
const dropped = [];

for (const spec of specs) {
	const src = fs.readFileSync(path.join(ROOT, spec), 'utf8');

	// proxyquire load targets — the first argument names the unit under test.
	const proxied = new Set();
	for (const m of src.matchAll(/\.load\(\s*'([^']+)'/g)) proxied.add(m[1]);
	for (const m of src.matchAll(/\bproxyquire\s*\(\s*'([^']+)'/g)) proxied.add(m[1]);

	let requests;
	let via;
	if (proxied.size > 0) {
		requests = [...proxied];
		via = 'proxyquire';
	} else {
		// value imports only — `import type` cannot carry behaviour.
		const imports = new Set();
		for (const m of src.matchAll(/^import\s+(?!type\s)[^;]*?from\s+'(\.[^']+)'/gm)) imports.add(m[1]);
		for (const m of src.matchAll(/^import\s+'(\.[^']+)'/gm)) imports.add(m[1]);
		for (const m of src.matchAll(/\brequire\(\s*'(\.[^']+)'\s*\)/g)) imports.add(m[1]);
		requests = [...imports];
		via = 'import';
	}

	const resolved = new Set();
	const unresolved = [];
	for (const r of requests) {
		if (!r.startsWith('.')) {
			unresolved.push(r);
			continue;
		}
		const f = resolveModule(spec, r);
		if (!f) {
			unresolved.push(r);
			continue;
		}
		if (isTestFile(f) || isHelper(f)) continue;
		resolved.add(f);
	}

	const sources = [...resolved];
	if (sources.length !== 1) {
		dropped.push({
			spec,
			rule: 1,
			reason: sources.length === 0 ? 'no source resolved' : `${sources.length} sources`,
			sources,
			via,
			unresolved,
		});
		continue;
	}
	pairs.push({ spec, source: sources[0], via });
}

// Rule 2: a source covered by more than one spec runs as one target.
const bySource = new Map();
for (const p of pairs) {
	if (!bySource.has(p.source)) bySource.set(p.source, []);
	bySource.get(p.source).push(p.spec);
}

const targets = [...bySource.entries()].map(([source, specFiles]) => ({ source, specs: specFiles.sort() }));

fs.writeFileSync(process.argv[2] || 'frame.json', JSON.stringify({ frameSize: specs.length, targets, dropped }, null, '\t'));
console.log(`frame: ${specs.length} specs`);
console.log(`dropped by rule 1: ${dropped.length}`);
console.log(`targets: ${targets.length} (merged ${pairs.length - targets.length} multi-spec sources)`);
