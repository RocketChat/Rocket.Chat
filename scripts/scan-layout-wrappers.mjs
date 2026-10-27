// Usage, from the repository root: node scripts/scan-layout-wrappers.mjs [--max <n>] [out.json]
// Lists every JSX use of Fuselage's `Margins`, `FlexContainer` and `FlexItem`. They inject props into the first `Box`
// below them through `BoxTransforms`, so they silently do nothing on anything else; space with `gap` or `Stack`, and
// set flex props on the element itself (docs/frontend/layout.md).
// With `--max`, fails when there are more than `n` findings, so CI keeps them from coming back.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const { values: options, positionals } = parseArgs({ options: { max: { type: 'string' } }, allowPositionals: true });
const out = positionals[0] ?? 'layout-wrappers-findings.json';
const fuselageSrc = join(root, 'packages/fuselage/src');
const DIRS = ['apps', 'packages', 'ee'];

const WRAPPERS = new Set(['Margins', 'FlexContainer', 'FlexItem']);
// The wrappers' own folders, which define them
const DEFINITIONS = [join(fuselageSrc, 'components/Margins'), join(fuselageSrc, 'components/Flex')];

const walk = (dir, files = []) => {
	for (const name of readdirSync(dir)) {
		if (['node_modules', 'dist', '.git', '.meteor', 'storybook-static', 'coverage'].includes(name)) continue;
		const path = join(dir, name);
		let stat;
		try {
			stat = statSync(path);
		} catch {
			// Dangling symlinks
			continue;
		}
		if (stat.isDirectory()) walk(path, files);
		else if (/\.(tsx|jsx)$/.test(name) && !/\.(spec|test|stories)\.[jt]sx$/.test(name)) files.push(path);
	}
	return files;
};

const findings = [];
for (const dir of DIRS) {
	let files = [];
	try {
		files = walk(join(root, dir));
	} catch {
		continue;
	}
	for (const file of files) {
		if (DEFINITIONS.some((definition) => file.startsWith(definition + sep))) continue;
		const source = readFileSync(file, 'utf8');
		if (![...WRAPPERS].some((wrapper) => source.includes(wrapper))) continue;

		const insideFuselage = file.startsWith(fuselageSrc);
		let ast;
		try {
			ast = parseAst(source, { lang: file.endsWith('.tsx') ? 'tsx' : 'jsx' });
		} catch {
			continue;
		}

		// Local name -> wrapper name; inside Fuselage, the wrappers are imported by relative path
		const imported = new Map();
		for (const statement of ast.body) {
			if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;
			const fromFuselage = statement.source.value === '@rocket.chat/fuselage' || (insideFuselage && statement.source.value.startsWith('.'));
			if (!fromFuselage) continue;
			for (const specifier of statement.specifiers) {
				if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') continue;
				const name = specifier.imported.name ?? specifier.imported.value;
				if (WRAPPERS.has(name)) imported.set(specifier.local.name, name);
			}
		}
		if (!imported.size) continue;

		const lineOf = (offset) => source.slice(0, offset).split('\n').length;
		const visit = (node) => {
			if (!node || typeof node.type !== 'string') return;
			if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && imported.has(node.name.name)) {
				findings.push({ file: relative(root, file).split(sep).join('/'), line: lineOf(node.start), wrapper: imported.get(node.name.name) });
			}
			for (const value of Object.values(node)) {
				if (Array.isArray(value)) value.forEach(visit);
				else if (value && typeof value === 'object') visit(value);
			}
		};
		visit(ast);
	}
}

writeFileSync(out, `${JSON.stringify(findings, null, '\t')}\n`);

const byWrapper = Object.entries(Object.groupBy(findings, (finding) => finding.wrapper)).map(
	([wrapper, list]) => `${wrapper} ${list.length}`,
);
console.log(
	`${findings.length} uses of Margins, FlexContainer and FlexItem${byWrapper.length ? ` (${byWrapper.join(', ')})` : ''}; full list: ${out}`,
);

if (options.max !== undefined) {
	const max = Number(options.max);
	if (!Number.isInteger(max) || max < 0) {
		console.error(`--max must be a non-negative integer, got ${options.max}`);
		process.exit(1);
	}
	if (findings.length > max) {
		console.error(
			`\n${findings.length} findings, more than the allowed ${max}: Margins, FlexContainer and FlexItem are deprecated. Space siblings with \`gap\` or \`Stack\`, and set flex props on the element itself (docs/frontend/layout.md). Every finding, with its file:line, is in ${out}.`,
		);
		process.exit(1);
	}
	if (findings.length < max) {
		console.log(
			`\n${findings.length} findings, fewer than the allowed ${max}: lower --max to ${findings.length} in .github/workflows/ci-code-check.yml.`,
		);
	}
}
