// Usage, from the repository root: node packages/fuselage/scripts/scan-spacing.mjs [out.json]
// Lists every literal spacing value passed to margin/padding/gap props (Box styling props, Margins props, any
// Fuselage component) and to spacing() calls, and flags the ones outside the design-system scale. See
// docs/proposals/fuselage-spacing-scale.md.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '../../..');
const out = process.argv[2] ?? 'spacing-findings.json';
const SCALE = new Set([4, 8, 12, 16, 20, 24, 32, 40]);
const DIRS = ['apps', 'packages', 'ee'];

const SPACING_PROP =
	/^(?:(?:margin|padding)(?:Block|Inline)?(?:Start|End)?|gap|rowGap|columnGap)$/;
// Margins takes its own prop names
const MARGINS_PROP = /^(?:all|block|inline|blockStart|blockEnd|inlineStart|inlineEnd)$/;

const files = [];
const walk = (dir) => {
	for (const name of readdirSync(dir)) {
		if (['node_modules', 'dist', '.git', '.meteor', 'storybook-static', 'coverage'].includes(name)) continue;
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) walk(path);
		else if (/\.(tsx|ts|jsx|js)$/.test(name) && !/\.d\.ts$/.test(name)) files.push(path);
	}
};
for (const d of DIRS) {
	try {
		walk(join(root, d));
	} catch {}
}

// Every literal a value can evaluate to: plain literals, both branches of ternaries and `||`/`??` fallbacks
const literals = (node) => {
	if (!node) return [];
	switch (node.type) {
		case 'Literal':
			return typeof node.value === 'string' || typeof node.value === 'number' ? [node.value] : [];
		case 'UnaryExpression':
			return node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number' ? [-node.argument.value] : [];
		case 'TemplateLiteral':
			return node.expressions.length === 0 ? [node.quasis[0].value.cooked] : [];
		case 'ConditionalExpression':
			return [...literals(node.consequent), ...literals(node.alternate)];
		case 'LogicalExpression':
			return [...literals(node.left), ...literals(node.right)];
		case 'JSXExpressionContainer':
		case 'TSAsExpression':
		case 'ParenthesizedExpression':
			return literals(node.expression);
		default:
			return [];
	}
};

/** Pixel value a spacing literal means, or null when it is not a spacing measure (auto, 50%, none…). */
const toPx = (value) => {
	if (typeof value === 'number') return value;
	const m = /^(neg-|-)?x(\d+)$/.exec(value);
	if (m) return (m[1] ? -1 : 1) * Number(m[2]);
	const px = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
	if (px) return Number(px[1]);
	return null;
};

const findings = [];
const lineOf = (src, offset) => src.slice(0, offset).split('\n').length;

for (const file of files) {
	const src = readFileSync(file, 'utf8');
	if (!/margin|padding|gap|Margins|spacing\(/.test(src)) continue;
	let ast;
	try {
		ast = parseAst(src, { lang: file.endsWith('x') ? (file.endsWith('.jsx') ? 'jsx' : 'tsx') : file.endsWith('.js') ? 'js' : 'ts' });
	} catch {
		continue;
	}
	const rel = relative(root, file);
	const area = rel.startsWith('packages/fuselage/') ? 'fuselage' : 'consumers';
	const kind = /\.(stories|spec|test)\.[jt]sx?$/.test(rel) || /__tests__|\.storybook/.test(rel) ? 'story/test' : 'code';

	const record = (prop, values, offset, via) => {
		for (const value of values) {
			const px = toPx(value);
			if (px === null) continue;
			const isToken = typeof value === 'string' && /x\d+/.test(value);
			findings.push({ file: rel, line: lineOf(src, offset), area, kind, prop, via, value, px, isToken, onScale: px === 0 || SCALE.has(Math.abs(px)) });
		}
	};

	const visit = (node, parentElement) => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach((n) => visit(n, parentElement));
		if (node.type === 'JSXOpeningElement') {
			const name = node.name.type === 'JSXIdentifier' ? node.name.name : node.name.type === 'JSXMemberExpression' ? node.name.property.name : '';
			for (const attr of node.attributes) {
				if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
				const prop = attr.name.name;
				const isMargins = name === 'Margins' && MARGINS_PROP.test(prop);
				if (!/^[A-Z]/.test(name) || !(SPACING_PROP.test(prop) || isMargins)) continue;
				record(prop, literals(attr.value), attr.start, isMargins ? 'Margins' : name);
			}
		}
		if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'spacing') {
			record('spacing()', literals(node.arguments[0]), node.start, 'spacing()');
		}
		for (const [key, child] of Object.entries(node)) {
			if (key !== 'type' && child && typeof child === 'object') visit(child, parentElement);
		}
	};
	visit(ast);
}

writeFileSync(out, JSON.stringify(findings, null, 1));
const off = findings.filter((f) => !f.onScale);
const by = (rows, key) => Object.entries(rows.reduce((acc, r) => ((acc[key(r)] = (acc[key(r)] ?? 0) + 1), acc), {})).sort((a, b) => b[1] - a[1]);
console.log(`files scanned: ${files.length}; spacing literals: ${findings.length}; off-scale: ${off.length}`);
for (const kindName of ['code', 'story/test']) {
	for (const areaName of ['consumers', 'fuselage']) {
		const rows = off.filter((f) => f.kind === kindName && f.area === areaName);
		console.log(`\n[${areaName} ${kindName}] off-scale ${rows.length}: ${by(rows, (r) => `${Math.abs(r.px)}px`).map(([k, v]) => `${k}:${v}`).join(' ')}`);
	}
}
const tokenOff = off.filter((f) => f.isToken);
console.log(`\noff-scale written as x-tokens: ${tokenOff.length}; as numbers/px: ${off.length - tokenOff.length}`);
