// Usage, from the repository root: node scripts/analyze-box-usage.mjs [--detector <name>] [--json <out.json>]
// Lists where `Box` and `Stack` are used as layout in the client and the UI packages, grouped by the replacement
// each use points to. Backs docs/proposals/box-in-screens.md; it reports, it does not gate CI (that is
// scan-raw-layout.mjs). Containers in a `layout/` folder, stories and specs are not scanned.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { parseAst } from 'vite';

const root = resolve(import.meta.dirname, '..');
const { values: options } = parseArgs({ options: { detector: { type: 'string' }, json: { type: 'string' } } });

const SCAN_ROOTS = [
	'apps/meteor/client',
	'apps/meteor/ee/client',
	'packages/ui-client',
	'packages/ui-voip',
	'packages/ui-conference',
	'packages/ui-account',
	'packages/ui-composer',
	'packages/ui-video-conf',
	'packages/onboarding-ui',
	'packages/web-ui-registration',
];
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'layout']);

const walk = (dir, files = []) => {
	let names;
	try {
		names = readdirSync(dir);
	} catch {
		return files;
	}
	for (const name of names) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (!SKIPPED_DIRS.has(name)) walk(path, files);
		} else if (name.endsWith('.tsx') && !/\.(spec|test|stories)\.tsx$/.test(name)) files.push(path);
	}
	return files;
};

const nameOf = (node) => (node.type === 'JSXIdentifier' ? node.name : undefined);
const SPACING = /^(m|p)(b|i|bs|be|is|ie|x|y)?$|^(margin|padding)/;
const SIZING = /^(width|height|size|minWidth|maxWidth|minHeight|maxHeight|alignSelf|flexGrow|flexShrink|overflow|position)$/;
const FLEX = /^(display|flexDirection|alignItems|justifyContent|flexWrap|gap)$/;

// A use of Box or Stack with what a detector needs to classify it.
const describe = (node, source, file) => {
	const opening = node.openingElement;
	const props = {};
	for (const attribute of opening.attributes) {
		if (attribute.type === 'JSXSpreadAttribute') continue;
		const { value } = attribute;
		let text = true;
		if (value?.type === 'Literal') text = String(value.value);
		else if (value?.type === 'JSXExpressionContainer' && value.expression.type === 'Literal') text = String(value.expression.value);
		else if (value) text = '{…}';
		props[attribute.name.name] = text;
	}
	const children = node.children.filter((child) => child.type === 'JSXElement').map((child) => nameOf(child.openingElement.name));
	return {
		file: relative(root, file).split(sep).join('/'),
		line: source.slice(0, node.start).split('\n').length,
		element: nameOf(opening.name),
		props,
		children,
	};
};

const propNames = (use) => Object.keys(use.props);
const onlyProps = (use, ...patterns) =>
	propNames(use).every((name) => patterns.some((pattern) => pattern.test(name)) || /^(key|id|ref|role|aria-.*|data-.*)$/.test(name));
const isFlex = (use) => use.props.display === 'flex' || use.element === 'Stack';

// Each detector names a replacement and says which uses point to it.
const DETECTORS = {
	'spacing-wrapper': {
		replacement: 'gap on the parent container',
		match: (use) =>
			use.children.length === 1 &&
			['Callout', 'Field', 'ButtonGroup', 'Throbber', 'States', 'Accordion', 'Tag', 'Divider'].includes(use.children[0]) &&
			onlyProps(use, SPACING, SIZING),
	},
	'empty-state-frame': {
		replacement: 'GenericNoResults / GenericError with a variation and fill',
		match: (use) => use.children.includes('States') && isFlex(use) && use.props.justifyContent === 'center',
	},
	'user-cell': {
		replacement: 'one shared user cell component',
		match: (use) => use.children.includes('UserAvatar') && use.children.includes('Box'),
	},
	'narrow-column': {
		replacement: 'a PageContent variation or PageColumn',
		match: (use) => ['x580', 'x600'].includes(use.props.maxWidth) && use.props.width === 'full',
	},
	'icon-label': {
		replacement: 'an icon-and-label component',
		match: (use) => isFlex(use) && use.props.alignItems === 'center' && use.children.includes('Icon') && !use.children.includes('Box'),
	},
	'skeleton-block': {
		replacement: 'a skeleton for a block of lines',
		match: (use) => use.children.filter((child) => child === 'Skeleton').length >= 2,
	},
	'virtualized-list': {
		replacement: 'a virtualized list container',
		match: (use) => use.children.includes('VirtualizedScrollbars'),
	},
	'modal-paragraph': {
		replacement: 'ModalContent spacing its paragraphs',
		match: (use) => use.props.is === 'p' && use.children.length === 0 && use.props.marginBlockEnd !== undefined,
	},
	'nested-box': {
		replacement: 'collapse into one element',
		match: (use) =>
			use.element === 'Box' &&
			use.children.length === 1 &&
			use.children[0] === 'Box' &&
			onlyProps(use, FLEX, SPACING, SIZING, /^(is|withTruncatedText|title)$/),
	},
};

const uses = [];
const margins = [];
for (const file of SCAN_ROOTS.flatMap((scanRoot) => walk(join(root, scanRoot)))) {
	const source = readFileSync(file, 'utf8');
	if (!/<(Box|Stack|Margins)\b/.test(source)) continue;
	let ast;
	try {
		ast = parseAst(source, { lang: 'tsx' });
	} catch (error) {
		console.error(`Skipping ${relative(root, file)}: ${error.message.split('\n')[0]}`);
		continue;
	}
	const visit = (node) => {
		if (!node || typeof node.type !== 'string') return;
		if (node.type === 'JSXElement') {
			const name = nameOf(node.openingElement.name);
			if (name === 'Box' || name === 'Stack') uses.push(describe(node, source, file));
			else if (name === 'Margins') margins.push(describe(node, source, file));
		}
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) value.forEach(visit);
			else if (value && typeof value === 'object') visit(value);
		}
	};
	visit(ast);
}

const report = Object.fromEntries(
	Object.entries(DETECTORS).map(([name, { replacement, match }]) => [name, { replacement, sites: uses.filter(match) }]),
);
report.margins = { replacement: 'gap on the parent container', sites: margins };

if (options.json) writeFileSync(options.json, `${JSON.stringify(report, null, '\t')}\n`);

const names = options.detector ? [options.detector] : Object.keys(report);
if (options.detector && !report[options.detector]) {
	console.error(`Unknown detector "${options.detector}". Known: ${Object.keys(report).join(', ')}`);
	process.exit(1);
}
console.log(`${uses.filter((use) => use.element === 'Box').length} Box, ${uses.filter((use) => use.element === 'Stack').length} Stack`);
for (const name of names) {
	const { replacement, sites } = report[name];
	console.log(`\n${name}: ${sites.length} sites, ${new Set(sites.map((site) => site.file)).size} files -> ${replacement}`);
	if (options.detector) for (const site of sites) console.log(`  ${site.file}:${site.line}`);
}
