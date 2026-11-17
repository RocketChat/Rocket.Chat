// Usage, from the repository root:
//   node scripts/scan-view-isolation.mjs [--max <n>] [--max-hook <n>] [--max-exempt <n>] [out.json]
// Lists every place a screen under apps/meteor/client/views reaches the browser directly: a use of `window`, `document`,
// `navigator`, `localStorage`, `sessionStorage` or `matchMedia`. Screens that stay clear of these can be reused outside the web client.
// Hits fall in three groups, each with its own ceiling: component hits (target 0), hook hits (a floor: the browser call sits
// behind a named hook) and exempt hits (folders that are web-only by design). A hit is a hook hit when its file is named `use*`
// or it sits inside a function named `use*`.
// Web-only widgets (react-virtuoso, virtua `VList`, `GenericMenu`, `createPortal`) are only reported, never gated.
// Imports from `meteor/*`, `apps/meteor/app/**` and `apps/meteor/client/meteor/**` are not counted here: oxlint forbids them
// (no-restricted-imports override in .oxlintrc.json). See docs/frontend/view-isolation.md.
// With a ceiling flag, fails when its group is above it, so CI keeps the counts from growing.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const meteorApp = join(root, 'apps/meteor');
const views = join(meteorApp, 'client/views');
const { values: options, positionals } = parseArgs({
	options: { 'max': { type: 'string' }, 'max-hook': { type: 'string' }, 'max-exempt': { type: 'string' } },
	allowPositionals: true,
});
const out = positionals[0] ?? 'view-isolation-findings.json';

const BROWSER_GLOBALS = new Set(['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'matchMedia']);
const EXEMPT_FOLDERS = [
	'apps/meteor/client/views/root/',
	'apps/meteor/client/views/conference/',
	'apps/meteor/client/views/room/contextualBar/VideoConference/',
];
const TEST_FOLDERS = new Set(['__tests__', '__mocks__', 'tests', 'testing']);

const walk = (dir, files = []) => {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (!TEST_FOLDERS.has(name)) walk(path, files);
		} else if (/\.tsx?$/.test(name) && !/\.(spec|test|stories)\.tsx?$/.test(name)) files.push(path);
	}
	return files;
};

// Not a property name, an object key, a declared binding or an import/export/type name
const isReference = (node, parent) => {
	if (!parent) return true;
	if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return false;
	if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return false;
	if (/^(TS|Import|Export)/.test(parent.type) && parent.type !== 'TSAsExpression' && parent.type !== 'TSNonNullExpression') return false;
	if (parent.type === 'VariableDeclarator' && parent.id === node) return false;
	if (/Function|Class/.test(parent.type) && parent.id === node) return false;
	return true;
};

const isHookName = (name) => /^use[A-Z0-9]/.test(name ?? '');

const functionName = (node, parent) => {
	if (node.type === 'FunctionDeclaration') return node.id?.name;
	if ((node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') && parent?.type === 'VariableDeclarator') {
		return parent.id?.name;
	}
	if (node.type === 'FunctionExpression' && (parent?.type === 'MethodDefinition' || parent?.type === 'Property') && !parent.computed) {
		return parent.key?.name;
	}
	return undefined;
};

const findings = [];
const widgets = [];
for (const file of walk(views)) {
	const source = readFileSync(file, 'utf8');
	let ast;
	try {
		ast = parseAst(source, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
	} catch (error) {
		// A file the scan can't read would hide its findings, so it fails the scan
		console.error(`Cannot parse ${relative(root, file)}: ${error.message}`);
		process.exit(1);
	}
	const path = relative(root, file).split(sep).join('/');
	const exempt = EXEMPT_FOLDERS.some((folder) => path.startsWith(folder));
	const hookFile = isHookName(path.slice(path.lastIndexOf('/') + 1));
	const lineOf = (offset) => source.slice(0, offset).split('\n').length;
	const add = (node, what, inHook) =>
		findings.push({ file: path, line: lineOf(node.start), what, kind: exempt ? 'exempt' : hookFile || inHook ? 'hook' : 'component' });
	const addWidget = (node, what) => widgets.push({ file: path, line: lineOf(node.start), what });

	const visit = (node, parent, inHook) => {
		if (!node || typeof node.type !== 'string') return;
		const insideHook = inHook || isHookName(functionName(node, parent));
		if (node.type === 'Identifier' && BROWSER_GLOBALS.has(node.name) && isReference(node, parent)) add(node, node.name, insideHook);
		if (node.type === 'ImportDeclaration' && node.importKind !== 'type') {
			for (const specifier of node.specifiers) {
				if (specifier.importKind === 'type') continue;
				const imported = specifier.imported?.name;
				if (node.source.value === 'react-virtuoso') addWidget(specifier, 'react-virtuoso');
				else if (node.source.value === 'virtua' && imported === 'VList') addWidget(specifier, 'virtua VList');
				else if ((imported ?? specifier.local.name) === 'GenericMenu') addWidget(specifier, 'GenericMenu');
			}
		}
		if (node.type === 'CallExpression' && (node.callee.name === 'createPortal' || node.callee.property?.name === 'createPortal')) {
			addWidget(node, 'createPortal');
		}
		for (const [key, value] of Object.entries(node)) {
			if (key === 'type') continue;
			if (Array.isArray(value)) value.forEach((child) => visit(child, node, insideHook));
			else if (value && typeof value === 'object') visit(value, node, insideHook);
		}
	};
	visit(ast, undefined, false);
}

const count = (kind) => findings.filter((finding) => finding.kind === kind).length;
const counts = { component: count('component'), hook: count('hook'), exempt: count('exempt') };
const widgetCounts = {};
for (const { what } of widgets) widgetCounts[what] = (widgetCounts[what] ?? 0) + 1;

writeFileSync(out, `${JSON.stringify({ counts, widgetCounts, findings, widgets }, null, '\t')}\n`);

console.log(
	`Direct browser-API reaches in screens: ${counts.component} in components, ${counts.hook} in hooks, ${counts.exempt} in exempt folders`,
);
console.log(
	`Web-only widgets (report only): ${Object.entries(widgetCounts)
		.map(([name, n]) => `${name} ${n}`)
		.join(', ')}`,
);
console.log(`Full list: ${out}`);

const ceilings = [
	['component', options.max, '--max'],
	['hook', options['max-hook'], '--max-hook'],
	['exempt', options['max-exempt'], '--max-exempt'],
];
let failed = false;
for (const [kind, raw, flag] of ceilings) {
	if (raw === undefined) continue;
	const max = Number(raw);
	if (!Number.isInteger(max) || max < 0) {
		console.error(`${flag} must be a non-negative integer, got ${raw}`);
		process.exit(1);
	}
	if (counts[kind] > max) {
		console.error(
			`\n${counts[kind]} ${kind} findings, more than the allowed ${max} (${flag}): a screen touches a browser global directly. Go through a hook instead (docs/frontend/view-isolation.md). Every finding, with its file:line, is in ${out}.`,
		);
		failed = true;
	} else if (counts[kind] < max) {
		console.log(
			`\n${counts[kind]} ${kind} findings, fewer than the allowed ${max}: lower ${flag} to ${counts[kind]} in .github/workflows/ci-code-check.yml.`,
		);
	}
}
if (failed) process.exit(1);
