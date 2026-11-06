// Usage, from the repository root: node scripts/scan-raw-layout.mjs [--max <n>] [out.json]
// Lists every raw layout element (`Box`, `div`, `span`, `section`) a screen under apps/meteor/client/views renders
// itself, instead of composing a named layout container. Containers in a `layout/` folder are where those elements
// belong, so they are not reported. See docs/frontend/layout.md.
// With `--max`, fails when there are more than `n` findings, so CI keeps the count from growing.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const views = join(root, 'apps/meteor/client/views');
const { values: options, positionals } = parseArgs({ options: { max: { type: 'string' } }, allowPositionals: true });
const out = positionals[0] ?? 'raw-layout-findings.json';

const RAW_ELEMENTS = new Set(['Box', 'div', 'span', 'section']);

const walk = (dir, files = []) => {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (name !== 'layout') walk(path, files);
		} else if (name.endsWith('.tsx') && !/\.(spec|test|stories)\.tsx$/.test(name)) files.push(path);
	}
	return files;
};

const findings = [];
for (const file of walk(views)) {
	const source = readFileSync(file, 'utf8');
	let ast;
	try {
		ast = parseAst(source, { lang: 'tsx' });
	} catch (error) {
		// A file the scan can't read would hide its findings, so it fails the scan
		console.error(`Cannot parse ${relative(root, file)}: ${error.message}`);
		process.exit(1);
	}
	const lineOf = (offset) => source.slice(0, offset).split('\n').length;
	const visit = (node) => {
		if (!node || typeof node.type !== 'string') return;
		if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && RAW_ELEMENTS.has(node.name.name)) {
			findings.push({ file: relative(root, file).split(sep).join('/'), line: lineOf(node.start), element: node.name.name });
		}
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) value.forEach(visit);
			else if (value && typeof value === 'object') visit(value);
		}
	};
	visit(ast);
}

writeFileSync(out, `${JSON.stringify(findings, null, '\t')}\n`);

const byElement = Object.entries(Object.groupBy(findings, (finding) => finding.element)).map(
	([element, list]) => `${element} ${list.length}`,
);
console.log(`${findings.length} raw layout elements in screens (${byElement.join(', ')}); full list: ${out}`);

if (options.max !== undefined) {
	const max = Number(options.max);
	if (!Number.isInteger(max) || max < 0) {
		console.error(`--max must be a non-negative integer, got ${options.max}`);
		process.exit(1);
	}
	if (findings.length > max) {
		console.error(
			`\n${findings.length} findings, more than the allowed ${max}: a screen renders a raw Box or HTML element for layout. Compose a named layout container instead, or put a new one in a \`layout/\` folder (docs/frontend/layout.md). Every finding, with its file:line, is in ${out}.`,
		);
		process.exit(1);
	}
	if (findings.length < max) {
		console.log(
			`\n${findings.length} findings, fewer than the allowed ${max}: lower --max to ${findings.length} in .github/workflows/ci-code-check.yml.`,
		);
	}
}
