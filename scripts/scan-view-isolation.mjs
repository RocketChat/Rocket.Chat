// Usage, from the repository root: node scripts/scan-view-isolation.mjs [--max <n>] [out.json]
// Lists every place a screen under apps/meteor/client/views reaches the browser directly: a use of `window`, `document`,
// `navigator`, `localStorage`, `sessionStorage` or `matchMedia`. Screens that stay clear of these can be reused outside the web client.
// Imports from `meteor/*`, `apps/meteor/app/**` and `apps/meteor/client/meteor/**` are not counted here: oxlint forbids them
// (no-restricted-imports override in .oxlintrc.json). See docs/frontend/view-isolation.md.
// With `--max`, fails when the total is above `n`, so CI keeps the count from growing.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const meteorApp = join(root, 'apps/meteor');
const views = join(meteorApp, 'client/views');
const { values: options, positionals } = parseArgs({ options: { max: { type: 'string' } }, allowPositionals: true });
const out = positionals[0] ?? 'view-isolation-findings.json';

const BROWSER_GLOBALS = new Set(['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'matchMedia']);
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

const findings = [];
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
	const lineOf = (offset) => source.slice(0, offset).split('\n').length;
	const add = (node, what) => findings.push({ file: relative(root, file).split(sep).join('/'), line: lineOf(node.start), what });

	const visit = (node, parent) => {
		if (!node || typeof node.type !== 'string') return;
		if (node.type === 'Identifier' && BROWSER_GLOBALS.has(node.name) && isReference(node, parent)) add(node, node.name);
		for (const [key, value] of Object.entries(node)) {
			if (key === 'type') continue;
			if (Array.isArray(value)) value.forEach((child) => visit(child, node));
			else if (value && typeof value === 'object') visit(value, node);
		}
	};
	visit(ast, undefined);
}

writeFileSync(out, `${JSON.stringify(findings, null, '\t')}\n`);

console.log(`${findings.length} direct browser-API reaches in screens; full list: ${out}`);

if (options.max !== undefined) {
	const max = Number(options.max);
	if (!Number.isInteger(max) || max < 0) {
		console.error(`--max must be a non-negative integer, got ${options.max}`);
		process.exit(1);
	}
	if (findings.length > max) {
		console.error(
			`\n${findings.length} findings, more than the allowed ${max}: a screen touches a browser global directly. Go through a hook instead (docs/frontend/view-isolation.md). Every finding, with its file:line, is in ${out}.`,
		);
		process.exit(1);
	}
	if (findings.length < max) {
		console.log(
			`\n${findings.length} findings, fewer than the allowed ${max}: lower --max to ${findings.length} in .github/workflows/ci-code-check.yml.`,
		);
	}
}
