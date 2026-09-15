'use strict';

/**
 * Static predictors P1, P2, P3 and the control C1, as pre-registered in
 * docs/proposals/mutation-testing-scope-experiment.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const countMatches = (text, re) => (text.match(re) || []).length;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Walks from an opening bracket to its match, ignoring strings, template literals and comments. */
const matchBracket = (text, open) => {
	const closing = { '(': ')', '{': '}', '[': ']' };
	const stack = [text[open]];
	let i = open + 1;
	while (i < text.length && stack.length) {
		const c = text[i];
		if (c === '/' && text[i + 1] === '/') {
			i = text.indexOf('\n', i);
			if (i === -1) return -1;
			continue;
		}
		if (c === '/' && text[i + 1] === '*') {
			i = text.indexOf('*/', i);
			if (i === -1) return -1;
			i += 2;
			continue;
		}
		if (c === "'" || c === '"' || c === '`') {
			const quote = c;
			i += 1;
			while (i < text.length && text[i] !== quote) i += text[i] === '\\' ? 2 : 1;
			i += 1;
			continue;
		}
		if (closing[c]) stack.push(c);
		else if (c === closing[stack[stack.length - 1]]) stack.pop();
		i += 1;
	}
	return stack.length ? -1 : i - 1;
};

/** Splits an object-literal body into its top-level entries. */
const topLevelEntries = (body) => {
	const entries = [];
	let start = 0;
	for (let i = 0; i <= body.length; i += 1) {
		const c = body[i];
		if (i === body.length || c === ',') {
			if (body.slice(start, i).trim() !== '') entries.push(body.slice(start, i).trim());
			start = i + 1;
			continue;
		}
		if ('({['.includes(c)) {
			const end = matchBracket(body, i);
			if (end !== -1) i = end;
			continue;
		}
		if (c === "'" || c === '"' || c === '`') {
			const quote = c;
			let j = i + 1;
			while (j < body.length && body[j] !== quote) j += body[j] === '\\' ? 2 : 1;
			i = j;
		}
	}
	return entries;
};

/** Every `proxyquire(...)` / `.load(...)` call: its module request and its stub-map body. */
const proxyquireCalls = (specText) => {
	const calls = [];
	for (const m of specText.matchAll(/(?:\.load|\bproxyquire)\(\s*'([^']+)'\s*,\s*\{/g)) {
		const open = m.index + m[0].length - 1;
		const close = matchBracket(specText, open);
		if (close === -1) continue;
		calls.push({ request: m[1], body: specText.slice(open + 1, close), start: m.index, end: close });
	}
	return calls;
};

/** P1 — oracle weakness. weak / (weak + strong); undefined when the spec asserts on no call. */
const oracleWeakness = (specText) => {
	const weak = countMatches(specText, /\.(called|calledOnce|notCalled)\b/g);
	const strong = countMatches(specText, /\.calledWith|\.calledWithExactly|\.args|\.getCall/g);
	// P1' — secondary. The pre-registered alternation cannot see `.calledOnceWith`, which 30 specs in the
	// frame use as their strongest assertion. Declared after the hand spot check, before any outcome was
	// joined. The pre-registered P1 stays the primary column.
	const strongWide = countMatches(specText, /\.calledWith|\.calledWithExactly|\.calledOnceWith|\.args|\.getCall/g);
	return {
		weak,
		strong,
		strongWide,
		p1: weak + strong === 0 ? null : weak / (weak + strong),
		p1Wide: weak + strongWide === 0 ? null : weak / (weak + strongWide),
	};
};

/** P2 — branch density. Branch points per mutated line; the whole source file is mutated. */
const branchDensity = (sourceText) => {
	const branches =
		countMatches(sourceText, /\bif\s*\(/g) +
		countMatches(sourceText, /\?[^?.:]*:/g) +
		countMatches(sourceText, /&&/g) +
		countMatches(sourceText, /\|\|/g) +
		countMatches(sourceText, /\?\?/g) +
		countMatches(sourceText, /\bcase\s/g);
	const lines = sourceText.split('\n').filter((line) => line.trim() !== '').length;
	return { branches, lines, p2: lines === 0 ? null : branches / lines };
};

/** P3 — effect surface. Distinct proxyquire stub-map keys plus sinon.stub declarations. */
const effectSurface = (specText) => {
	const keys = new Set();
	for (const call of proxyquireCalls(specText)) {
		for (const entry of topLevelEntries(call.body)) {
			const key = entry.match(/^'([^']+)'|^"([^"]+)"|^(\w+)/);
			if (key) keys.add(key[1] || key[2] || key[3]);
		}
	}
	const sinonStubs = countMatches(specText, /\bsinon\.stub\(/g);
	return { stubMapKeys: keys.size, sinonStubs, p3: keys.size + sinonStubs };
};

/** The names the spec calls the unit under test by. */
const unitSymbols = (specText, source) => {
	const base = path.basename(source).replace(/\.(ts|tsx|js|jsx)$/, '');
	const hitsSource = (request) => path.basename(request).replace(/\.(ts|tsx|js|jsx)$/, '') === base;
	const names = new Set();

	// import { a, b as c } from './source'
	for (const m of specText.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
		if (!hitsSource(m[2])) continue;
		for (const raw of m[1].split(',')) {
			const name = raw
				.split(/\s+as\s+/)
				.pop()
				.trim();
			if (name) names.add(name);
		}
	}
	// import a from './source'  /  import * as a from './source'
	for (const m of specText.matchAll(/import\s+(?:\*\s+as\s+)?(\w+)\s+from\s*'([^']+)'/g)) {
		if (hitsSource(m[2])) names.add(m[1]);
	}
	// const { a } = proxyquire…load('./source', {…})  /  const m = proxyquire('./source', {…})
	for (const call of proxyquireCalls(specText)) {
		if (!hitsSource(call.request)) continue;
		// The binding sits just before the call: `const { a } = proxyquire…` or `subject = proxyquire(…`.
		const before = specText.slice(Math.max(0, call.start - 300), call.start);
		const binding = [...before.matchAll(/(?:(?:const|let|var)\s+)?(\{[\s\S]*?\}|\w+)\s*=\s*[\s\S]{0,60}$/g)].pop();
		if (!binding) continue;
		const target = binding[1];
		if (target.startsWith('{')) {
			for (const raw of target.slice(1, -1).split(',')) {
				const name = raw.split(':').pop().trim();
				if (name) names.add(name);
			}
		} else {
			names.add(target);
		}
	}
	return [...names];
};

/** C1 — input-domain size. Distinct literal argument values the spec passes to the unit. */
const inputDomain = (specText, source) => {
	const symbols = unitSymbols(specText, source);
	const literals = new Set();
	for (const symbol of symbols) {
		// `unit(` and, for a module binding, `unit.member(`.
		const re = new RegExp(`\\b${escapeRe(symbol)}(?:\\.\\w+)?\\s*\\(`, 'g');
		for (const m of specText.matchAll(re)) {
			const open = m.index + m[0].length - 1;
			const close = matchBracket(specText, open);
			if (close === -1) continue;
			const args = specText.slice(open + 1, close);
			const found = args.match(
				/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|\b-?\d+(?:\.\d+)?\b|\b(?:true|false|null|undefined)\b/g,
			);
			for (const lit of found || []) literals.add(lit);
		}
	}
	return { symbols: symbols.length, c1: literals.size };
};

const frame = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = frame.targets.map((t) => {
	const specText = t.specs.map(read).join('\n');
	const sourceText = read(t.source);
	return {
		source: t.source,
		specs: t.specs,
		...oracleWeakness(specText),
		...branchDensity(sourceText),
		...effectSurface(specText),
		...inputDomain(specText, t.source),
	};
});

fs.writeFileSync(process.argv[3], JSON.stringify(rows, null, '\t'));
console.log(`predictors for ${rows.length} targets`);
console.log('P1 defined for', rows.filter((r) => r.p1 !== null).length);
console.log('C1 with no resolved symbol:', rows.filter((r) => r.symbols === 0).length);
