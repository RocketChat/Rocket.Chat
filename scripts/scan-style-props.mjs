// Usage, from the repository root: node scripts/scan-style-props.mjs [--max <n>] [out.json]
// Lists every JSX use of a Fuselage component that passes it a `Box` styling prop the component doesn't declare
// itself, an `is` prop or an `rcx-*` prop, and every element laid out by a `Margins` or `Scrollable` parent. See
// docs/proposals/fuselage-component-style-props.md.
// With `--max`, fails when there are more than `n` findings, so CI keeps the count from growing while it is migrated.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const { values: options, positionals } = parseArgs({ options: { max: { type: 'string' } }, allowPositionals: true });
const out = positionals[0] ?? 'style-props-findings.json';
const fuselageSrc = join(root, 'packages/fuselage/src');
const DIRS = ['apps', 'packages', 'ee'];

// `Box` and the layout primitives built on it are where styling props belong; `Margins` and `Scrollable` are reported
// through the elements they lay out
const LAYOUT_PRIMITIVES = new Set(['Box', 'Margins', 'Scrollable', 'Flex', 'FlexContainer', 'FlexItem', 'StylingBox', 'Stack']);
const PROP_INJECTORS = new Set(['Margins', 'Scrollable']);

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

// The styling prop names, read from the keys of `propDefs`
const stylingSource = readFileSync(join(fuselageSrc, 'components/Box/stylingProps.ts'), 'utf8');
const propDefs = stylingSource.slice(stylingSource.indexOf('export const propDefs'));
const STYLING_PROPS = new Set([...propDefs.slice(0, propDefs.indexOf('\n};')).matchAll(/^\t(\w+):/gm)].map((match) => match[1]));

const category = (prop) => {
	if (/^margin/.test(prop)) return 'spacing between siblings';
	if (['flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'justifySelf', 'order'].includes(prop)) return 'flex child';
	if (/^(min|max)?(Width|Height|width|height)$|^(min|max)?[sS]ize$/.test(prop)) return 'dimensions';
	if (
		/^border|^font|^text/.test(prop) ||
		[
			'color',
			'backgroundColor',
			'lineHeight',
			'letterSpacing',
			'opacity',
			'elevation',
			'invisible',
			'withTruncatedText',
			'wordBreak',
		].includes(prop)
	) {
		return 'visual';
	}
	return 'own layout';
};

// Each component's own source, to tell a prop it declares (`Icon`'s `size`) from a `Box` styling prop it forwards
const componentSources = new Map();
for (const file of walk(join(fuselageSrc, 'components'))) {
	componentSources.set(basename(file).replace(/\.[jt]sx$/, ''), readFileSync(file, 'utf8').replace(/\/\/.*$/gm, ''));
}
// Components exported under another name (`OptionIcon as MenuItemIcon`) declare what the original does
for (const dir of readdirSync(join(fuselageSrc, 'components'))) {
	let index;
	try {
		index = readFileSync(join(fuselageSrc, 'components', dir, 'index.ts'), 'utf8');
	} catch {
		continue;
	}
	for (const [, original, alias] of index.matchAll(/\b(\w+) as (\w+)\b/g)) {
		if (componentSources.has(original) && !componentSources.has(alias)) componentSources.set(alias, componentSources.get(original));
	}
}
const declaredCache = new Map();
const declares = (component, prop, seen = new Set()) => {
	const key = `${component}.${prop}`;
	if (!declaredCache.has(key)) {
		seen.add(component);
		const source = componentSources.get(component) ?? '';
		declaredCache.set(
			key,
			// A typed member (`size?:`), a picked `Box` prop (`Pick<BoxProps, 'size'>`) or a destructured parameter (`{ size = 'x36', … }`)
			new RegExp(`(^|[\\s{,(])${prop}\\??:`, 'm').test(source) ||
				new RegExp(`Pick<[^>]*'${prop}'`).test(source) ||
				new RegExp(`[{,]\\s*${prop}(\\s*=\\s*[^,}]+)?\\s*[,}]`).test(source) ||
				// Or the props type of another Fuselage component it builds on (`type SidebarItemLinkProps = ItemLinkProps`); never `Box`'s, which takes every prop
				[...source.matchAll(/\b(\w+)Props\b/g)]
					.map(([, other]) => other)
					.some((other) => other !== 'Box' && !seen.has(other) && componentSources.has(other) && declares(other, prop, seen)),
		);
	}
	return declaredCache.get(key);
};

const lineOf = (source, offset) => source.slice(0, offset).split('\n').length;

const children = (node) => {
	const result = [];
	for (const [key, value] of Object.entries(node)) {
		if (key === 'type' || !value || typeof value !== 'object') continue;
		if (Array.isArray(value)) result.push(...value.filter((item) => item && typeof item.type === 'string'));
		else if (typeof value.type === 'string') result.push(value);
	}
	return result;
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
		const source = readFileSync(file, 'utf8');
		const insideFuselage = file.startsWith(fuselageSrc);
		if (!insideFuselage && !source.includes('@rocket.chat/fuselage')) continue;

		let ast;
		try {
			ast = parseAst(source, { lang: file.endsWith('.tsx') ? 'tsx' : 'jsx' });
		} catch {
			continue;
		}

		// Local name -> Fuselage component name; inside Fuselage, components are used by their own names
		const imported = new Map();
		for (const statement of ast.body) {
			if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;
			const fromFuselage = statement.source.value === '@rocket.chat/fuselage' || (insideFuselage && statement.source.value.startsWith('.'));
			if (!fromFuselage) continue;
			for (const specifier of statement.specifiers) {
				if (specifier.type === 'ImportSpecifier' && specifier.importKind !== 'type') {
					const name = specifier.imported.name ?? specifier.imported.value;
					if (!insideFuselage || componentSources.has(name)) imported.set(specifier.local.name, name);
				}
			}
		}
		if (!imported.size) continue;

		const componentOf = (opening) => (opening.name.type === 'JSXIdentifier' ? imported.get(opening.name.name) : undefined);

		// `injector` is the `Margins` or `Scrollable` whose props reach this element: like `BoxTransforms`, they pass
		// through DOM elements and stop at the first Fuselage component, `Box` included
		const visit = (node, injector) => {
			if (node.type === 'JSXElement') {
				const component = componentOf(node.openingElement);
				visit(node.openingElement, injector);
				let next = injector;
				if (component) next = PROP_INJECTORS.has(component) ? component : undefined;
				for (const child of node.children) visit(child, next);
				return;
			}
			if (node.type === 'JSXOpeningElement' && componentOf(node)) {
				const component = componentOf(node);
				const props = [];
				for (const attribute of node.attributes) {
					if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
					const prop = attribute.name.name;
					if (prop === 'is') {
						if (!declares(component, prop)) props.push({ prop, category: 'polymorphism (is)' });
					} else if (prop.startsWith('rcx-')) props.push({ prop, category: 'rcx-* class prop' });
					else if (STYLING_PROPS.has(prop) && !declares(component, prop)) props.push({ prop, category: category(prop) });
				}
				const reportable = !LAYOUT_PRIMITIVES.has(component) && (props.length || injector);
				if (reportable) {
					findings.push({
						file: relative(root, file),
						line: lineOf(source, node.start),
						component,
						props,
						...(injector && { laidOutBy: injector }),
						inFuselage: insideFuselage,
					});
				}
			}
			// JSX inside attribute values or other expressions isn't laid out by an enclosing injector
			for (const child of children(node)) visit(child, node.type === 'JSXOpeningElement' ? undefined : injector);
		};
		visit(ast, undefined);
	}
}

writeFileSync(out, JSON.stringify(findings, null, '\t'));

const app = findings.filter((finding) => !finding.inFuselage);
const count = (list, predicate) => list.filter(predicate).length;
console.log(
	`use-sites outside Fuselage: ${count(app, (f) => f.props.length)} pass undeclared styling, is or rcx-* props; ${count(app, (f) => f.laidOutBy)} are laid out by Margins/Scrollable`,
);
console.log(
	`use-sites inside Fuselage: ${count(findings, (f) => f.inFuselage && f.props.length)} pass them; ${count(findings, (f) => f.inFuselage && f.laidOutBy)} are laid out by Margins/Scrollable`,
);

const byCategory = new Map();
for (const finding of findings) for (const { category: c } of finding.props) byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
console.log('\nprop uses by category:');
for (const [c, n] of [...byCategory].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${c}`);

const byComponent = new Map();
for (const finding of findings) {
	if (!finding.props.length) continue;
	const entry = byComponent.get(finding.component) ?? { sites: 0, props: new Map() };
	entry.sites++;
	for (const { prop } of finding.props) entry.props.set(prop, (entry.props.get(prop) ?? 0) + 1);
	byComponent.set(finding.component, entry);
}
console.log(`\n${byComponent.size} components receive them; the most:`);
for (const [component, { sites, props }] of [...byComponent].sort((a, b) => b[1].sites - a[1].sites).slice(0, 25)) {
	const top = [...props]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([prop, n]) => `${prop} ${n}`)
		.join(', ');
	console.log(`  ${String(sites).padStart(4)}  ${component}: ${top}`);
}
console.log(`\nfull list: ${out}`);

if (options.max !== undefined) {
	const max = Number(options.max);
	if (!Number.isInteger(max) || max < 0) {
		console.error(`--max must be a non-negative integer, got ${options.max}`);
		process.exit(1);
	}
	if (findings.length > max) {
		console.error(
			`\n${findings.length} findings, more than the allowed ${max}: a change passes a styling prop to a Fuselage component, or lays one out with Margins/Scrollable. Style it with a Box around it, or a variation the component declares (see the proposal). Every finding, with its file:line, is in ${out}.`,
		);
		process.exitCode = 1;
	} else if (findings.length < max) {
		console.log(
			`\n${findings.length} findings, fewer than the allowed ${max}: lower --max to ${findings.length} in .github/workflows/ci-code-check.yml.`,
		);
	}
}
