/**
 * Generates the UiKit reference and support matrix under docs/features/uikit/
 * straight from the type definitions and renderer classes, so the docs cannot
 * drift from the code. `--check` fails instead of writing when output is stale.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const uiKitSrc = join(repoRoot, 'packages/ui-kit/src');
const outDir = join(repoRoot, 'docs/features/uikit');
const generatorPath = 'packages/ui-kit/scripts/generate-docs.mts';

type SurfaceSpec = {
	name: string;
	parserFile: string;
	parserClass: string;
	layoutType: string;
};

type RendererSpec = {
	label: string;
	surface: string;
	file: string;
	className: string;
};

const surfaces: SurfaceSpec[] = [
	{
		name: 'message',
		parserFile: 'surfaces/message/UiKitParserMessage.ts',
		parserClass: 'UiKitParserMessage',
		layoutType: 'MessageSurfaceLayoutBlock',
	},
	{
		name: 'modal',
		parserFile: 'surfaces/modal/UiKitParserModal.ts',
		parserClass: 'UiKitParserModal',
		layoutType: 'ModalSurfaceLayoutBlock',
	},
	{
		name: 'banner',
		parserFile: 'surfaces/banner/UiKitParserBanner.ts',
		parserClass: 'UiKitParserBanner',
		layoutType: 'BannerSurfaceLayoutBlock',
	},
	{
		name: 'contextualBar',
		parserFile: 'surfaces/contextualBar/UiKitParserContextualBar.ts',
		parserClass: 'UiKitParserContextualBar',
		layoutType: 'ContextualBarSurfaceLayoutBlock',
	},
	{
		name: 'attachment',
		parserFile: 'surfaces/attachment/UiKitParserAttachment.ts',
		parserClass: 'UiKitParserAttachment',
		layoutType: 'AttachmentSurfaceLayoutBlock',
	},
];

const renderers: RendererSpec[] = [
	{
		label: 'Fuselage',
		surface: 'message',
		file: 'packages/fuselage-ui-kit/src/surfaces/FuselageMessageSurfaceRenderer.tsx',
		className: 'FuselageMessageSurfaceRenderer',
	},
	{
		label: 'Livechat',
		surface: 'message',
		file: 'packages/livechat/src/components/uiKit/message/index.tsx',
		className: 'MessageParser',
	},
	{
		label: 'Fuselage',
		surface: 'modal',
		file: 'packages/fuselage-ui-kit/src/surfaces/ModalSurfaceRenderer.tsx',
		className: 'ModalSurfaceRenderer',
	},
	{
		label: 'Fuselage',
		surface: 'banner',
		file: 'packages/fuselage-ui-kit/src/surfaces/BannerSurfaceRenderer.tsx',
		className: 'BannerSurfaceRenderer',
	},
	{
		label: 'Fuselage',
		surface: 'contextualBar',
		file: 'packages/fuselage-ui-kit/src/surfaces/ContextualBarSurfaceRenderer.tsx',
		className: 'ContextualBarSurfaceRenderer',
	},
];

const elementContainers = [
	{ label: 'actions', file: 'blocks/layout/ActionsBlock.ts', typeName: 'ActionsBlock', path: ['elements'] },
	{ label: 'input', file: 'blocks/layout/InputBlock.ts', typeName: 'InputBlock', path: ['element'] },
	{ label: 'section accessory', file: 'blocks/layout/SectionBlock.ts', typeName: 'SectionBlock', path: ['accessory'] },
	{ label: 'context', file: 'blocks/layout/ContextBlock.ts', typeName: 'ContextBlock', path: ['elements'] },
	{ label: 'callout accessory', file: 'blocks/layout/CalloutBlock.ts', typeName: 'CalloutBlock', path: ['accessory'] },
	{ label: 'info_card row', file: 'blocks/layout/InfoCardBlock.ts', typeName: 'InfoCardBlock', path: ['rows', 'elements'] },
	{ label: 'info_card action', file: 'blocks/layout/InfoCardBlock.ts', typeName: 'InfoCardBlock', path: ['rows', 'action'] },
	{
		label: 'tab_navigation',
		file: 'blocks/layout/ExperimentalTabNavigationBlock.ts',
		typeName: 'ExperimentalTabNavigationBlock',
		path: ['tabs'],
	},
];

// Elements drawn by their parent block's component instead of a renderer method.
const renderedByParent: Record<string, string> = {
	tab: 'tab_navigation',
};

const referenceSections = [
	{ title: 'Layout blocks', file: 'blocks/LayoutBlock.ts', typeName: 'LayoutBlock' },
	{ title: 'Block elements', file: 'blocks/BlockElement.ts', typeName: 'BlockElement' },
	{ title: 'Text objects', file: 'blocks/TextObject.ts', typeName: 'TextObject' },
];

const compositionObjects = [
	{ file: 'blocks/Option.ts', typeName: 'Option' },
	{ file: 'blocks/OptionGroup.ts', typeName: 'OptionGroup' },
	{ file: 'blocks/ConfirmationDialog.ts', typeName: 'ConfirmationDialog' },
];

const views = [
	{ file: 'surfaces/modal/ModalView.ts', typeName: 'ModalView' },
	{ file: 'surfaces/banner/BannerView.ts', typeName: 'BannerView' },
	{ file: 'surfaces/contextualBar/ContextualBarView.ts', typeName: 'ContextualBarView' },
];

const program = ts.createProgram({
	rootNames: [
		join(uiKitSrc, 'index.ts'),
		...surfaces.map((s) => join(uiKitSrc, s.parserFile)),
		...renderers.map((r) => join(repoRoot, r.file)),
	],
	options: {
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		jsx: ts.JsxEmit.ReactJSX,
		strict: true,
		noEmit: true,
		skipLibCheck: true,
		baseUrl: repoRoot,
		paths: { '@rocket.chat/ui-kit': ['packages/ui-kit/src/index.ts'] },
	},
});
const checker = program.getTypeChecker();

const getSourceFile = (path: string) => {
	const sourceFile = program.getSourceFile(path);
	if (!sourceFile) {
		throw new Error(`Source file not found: ${path}`);
	}
	return sourceFile;
};

const findDeclaration = <T extends ts.Node>(path: string, name: string, guard: (node: ts.Node) => node is T): T => {
	let found: T | undefined;
	const visit = (node: ts.Node) => {
		if (found) return;
		if (guard(node) && (node as unknown as { name?: ts.Identifier }).name?.text === name) {
			found = node;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(getSourceFile(path));
	if (!found) {
		throw new Error(`Declaration ${name} not found in ${relative(repoRoot, path)}`);
	}
	return found;
};

const typeAlias = (file: string, name: string) => {
	const declaration = findDeclaration(join(uiKitSrc, file), name, ts.isTypeAliasDeclaration);
	return { declaration, type: checker.getTypeFromTypeNode(declaration.type) };
};

const unionMembers = (type: ts.Type): ts.Type[] => (type.isUnion() ? type.types : [type]);

const tagOf = (type: ts.Type): string | undefined => {
	const tag = type.getProperty('type');
	if (!tag) return undefined;
	const tagType = checker.getTypeOfSymbol(tag);
	return tagType.isStringLiteral() ? tagType.value : undefined;
};

/** Flattens a type into its union members, unwrapping arrays and dropping `undefined`. */
const itemsOf = (type: ts.Type): ts.Type[] =>
	unionMembers(checker.getNonNullableType(type)).flatMap((member) => {
		if (!checker.isArrayType(member) && !checker.isTupleType(member)) return [member];
		const element = checker.getIndexTypeOfType(member, ts.IndexKind.Number);
		return element ? unionMembers(element) : [];
	});

const tagsOf = (type: ts.Type): string[] => [...new Set(itemsOf(type).flatMap((item) => tagOf(item) ?? []))];

const typeAtPath = (type: ts.Type, path: string[], location: ts.Node): ts.Type[] =>
	path.reduce<ts.Type[]>(
		(current, name) =>
			current.flatMap((item) => {
				const property = item.getProperty(name);
				return property ? itemsOf(checker.getTypeOfSymbolAtLocation(property, location)) : [];
			}),
		[type],
	);

const resolveClass = (expression: ts.Expression): ts.ClassDeclaration | undefined => {
	let symbol = checker.getSymbolAtLocation(expression);
	if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
		symbol = checker.getAliasedSymbol(symbol);
	}
	return symbol?.declarations?.find(ts.isClassDeclaration);
};

const classChain = (declaration: ts.ClassDeclaration): ts.ClassDeclaration[] => {
	const chain = [declaration];
	let current: ts.ClassDeclaration | undefined = declaration;
	while (current) {
		const base: ts.ExpressionWithTypeArguments | undefined = current.heritageClauses?.find(
			(clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
		)?.types[0];
		current = base ? resolveClass(base.expression) : undefined;
		if (current) chain.push(current);
	}
	return chain;
};

/** The block types a renderer lets through: the first array literal handed to `super()` along its class chain. */
const allowlistOf = (chain: ts.ClassDeclaration[]): string[] => {
	for (const declaration of chain) {
		const constructor = declaration.members.find(ts.isConstructorDeclaration);
		let literal: ts.ArrayLiteralExpression | undefined;
		const visit = (node: ts.Node) => {
			if (literal) return;
			if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword) {
				const findArray = (child: ts.Node) => {
					if (literal) return;
					if (ts.isArrayLiteralExpression(child)) literal = child;
					else ts.forEachChild(child, findArray);
				};
				node.arguments.forEach(findArray);
				return;
			}
			ts.forEachChild(node, visit);
		};
		if (constructor) visit(constructor);
		if (literal) {
			return literal.elements.filter(ts.isStringLiteral).map((element) => element.text);
		}
	}
	return [];
};

const methodsOf = (chain: ts.ClassDeclaration[]): Set<string> => {
	const names = new Set<string>();
	for (const declaration of chain) {
		for (const member of declaration.members) {
			if ((ts.isMethodDeclaration(member) || ts.isPropertyDeclaration(member)) && member.name && ts.isIdentifier(member.name)) {
				names.add(member.name.text);
			}
		}
	}
	return names;
};

const loadClass = (path: string, className: string) => {
	const chain = classChain(findDeclaration(path, className, ts.isClassDeclaration));
	return { allowlist: allowlistOf(chain), methods: methodsOf(chain) };
};

const escapeCell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

const typeText = (type: ts.Type) =>
	checker.typeToString(
		checker.getNonNullableType(type),
		undefined,
		ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
	);

// No line anchors: they would make the check fail on edits that do not change any type.
const sourceLink = (node: ts.Node, fromDir: string) => relative(fromDir, node.getSourceFile().fileName);

const declarationOf = (type: ts.Type) => (type.aliasSymbol ?? type.getSymbol())?.declarations?.[0];

/** Renders one field table; union variants sharing a tag are merged, and a field missing from any variant is optional. */
const fieldTable = (variants: ts.Type[]) => {
	type Field = { name: string; types: Set<string>; optional: boolean; docs: string; seen: number };
	const fields = new Map<string, Field>();
	for (const variant of variants) {
		for (const property of checker.getPropertiesOfType(variant)) {
			const declaration = property.valueDeclaration ?? property.declarations?.[0];
			const propertyType = declaration ? checker.getTypeOfSymbolAtLocation(property, declaration) : checker.getTypeOfSymbol(property);
			if (checker.getNonNullableType(propertyType).flags & ts.TypeFlags.Never) continue;
			const field = fields.get(property.name) ?? {
				name: property.name,
				types: new Set<string>(),
				optional: false,
				docs: '',
				seen: 0,
			};
			// The annotation as written keeps the author's alias names; the checker would expand them (e.g. every icon name).
			const annotation =
				declaration && (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) ? declaration.type : undefined;
			field.types.add(annotation ? annotation.getText().replace(/\s+/g, ' ') : typeText(propertyType));
			field.optional ||= Boolean(property.flags & ts.SymbolFlags.Optional);
			field.docs ||= ts.displayPartsToString(property.getDocumentationComment(checker));
			field.seen += 1;
			fields.set(property.name, field);
		}
	}
	const rows = [...fields.values()].map((field) => {
		const required = !field.optional && field.seen === variants.length ? 'yes' : 'no';
		return `| \`${field.name}\` | \`${escapeCell([...field.types].join(' | '))}\` | ${required} | ${escapeCell(field.docs)} |`;
	});
	return ['| Field | Type | Required | Notes |', '| --- | --- | --- | --- |', ...rows].join('\n');
};

const typeSection = (heading: string, variants: ts.Type[], anchorNode: ts.Node | undefined, extra: string[] = []) => {
	const lines = [`### ${heading}`, ''];
	if (anchorNode)
		lines.push(`Source: [\`${relative(repoRoot, anchorNode.getSourceFile().fileName)}\`](${sourceLink(anchorNode, outDir)})`, '');
	lines.push(...extra, fieldTable(variants), '');
	return lines.join('\n');
};

const header = (title: string, intro: string) =>
	[
		`<!-- Generated by ${generatorPath}. Do not edit by hand: run \`yarn workspace @rocket.chat/ui-kit docs\`. -->`,
		'',
		`# ${title}`,
		'',
		intro,
		'',
	].join('\n');

const mark = (value: boolean) => (value ? '✅' : '—');

const renderSupportMatrix = () => {
	const { type: layoutUnion } = typeAlias('blocks/LayoutBlock.ts', 'LayoutBlock');
	const allBlocks = tagsOf(layoutUnion).sort();
	const { type: elementUnion } = typeAlias('blocks/BlockElement.ts', 'BlockElement');
	const allElements = tagsOf(elementUnion).sort();

	const divergences: string[] = [];
	const surfaceTables = surfaces.map((surface) => {
		const typeAllows = new Set(tagsOf(typeAlias(surface.parserFile, surface.layoutType).type));
		const parserAllows = new Set(loadClass(join(uiKitSrc, surface.parserFile), surface.parserClass).allowlist);
		const surfaceRenderers = renderers
			.filter((renderer) => renderer.surface === surface.name)
			.map((renderer) => {
				const { allowlist, methods } = loadClass(join(repoRoot, renderer.file), renderer.className);
				const allowed = new Set(allowlist);
				return { label: renderer.label, renders: (block: string) => allowed.has(block) && methods.has(block), allowed, methods };
			});

		const columns = ['Block', 'Type allows', '`ui-kit` parser', ...surfaceRenderers.map((renderer) => `${renderer.label} renders`)];
		const rows = allBlocks
			.filter((block) => block !== 'conditional')
			.map((block) => {
				const cells = [typeAllows.has(block), parserAllows.has(block), ...surfaceRenderers.map((renderer) => renderer.renders(block))];
				if (cells.some((cell) => cell !== cells[0])) {
					const where = [
						typeAllows.has(block) ? 'type allows it' : 'type rejects it',
						parserAllows.has(block) ? '`ui-kit` parser allows it' : '`ui-kit` parser drops it',
						...surfaceRenderers.map((renderer) => {
							if (renderer.renders(block)) return `${renderer.label} renders it`;
							if (renderer.allowed.has(block)) return `${renderer.label} allows it but has no \`${block}\` method`;
							return `${renderer.label} drops it`;
						}),
					];
					divergences.push(`- **${surface.name} / \`${block}\`**: ${where.join(', ')}.`);
				}
				return `| \`${block}\` | ${cells.map(mark).join(' | ')} |`;
			});
		const note = surfaceRenderers.length ? [] : ['', '> No client renderer is registered for this surface.'];
		return [
			`### ${surface.name}`,
			'',
			`| ${columns.join(' | ')} |`,
			`| ${columns.map(() => '---').join(' | ')} |`,
			...rows,
			...note,
			'',
		].join('\n');
	});

	const methodsOfLabel = (label: string) =>
		new Set(
			renderers
				.filter((renderer) => renderer.label === label)
				.flatMap((renderer) => [...loadClass(join(repoRoot, renderer.file), renderer.className).methods]),
		);
	const fuselageMethods = methodsOfLabel('Fuselage');
	const livechatMethods = methodsOfLabel('Livechat');
	const containerTags = elementContainers.map((container) => {
		const { declaration, type } = typeAlias(container.file, container.typeName);
		const items = typeAtPath(type, container.path, declaration);
		if (!items.length) throw new Error(`${container.typeName}.${container.path.join('.')} not found`);
		return new Set(items.flatMap((item) => tagOf(item) ?? []));
	});
	const elementColumns = ['Element', ...elementContainers.map((container) => container.label), 'Fuselage renders', 'Livechat renders'];
	const elementRows = allElements.map((element) => {
		const parent = renderedByParent[element];
		const fuselageRenders = fuselageMethods.has(element) || Boolean(parent && fuselageMethods.has(parent));
		const livechatRenders = livechatMethods.has(element) || Boolean(parent && livechatMethods.has(parent));
		if (containerTags.some((tags) => tags.has(element)) && !fuselageRenders) {
			divergences.push(
				`- **element \`${element}\`**: accepted by a block type, but Fuselage has no \`${element}\` method, so it never renders.`,
			);
		}
		const cells = [...containerTags.map((tags) => tags.has(element)), fuselageRenders, livechatRenders];
		return `| \`${element}\`${parent ? ` (via \`${parent}\`)` : ''} | ${cells.map(mark).join(' | ')} |`;
	});

	return [
		header(
			'UiKit support matrix',
			[
				'Which layout blocks each surface accepts, at each layer that decides it. Only the renderer columns decide what a user sees; the other two are the contract the renderers are supposed to honour:',
				'',
				'- **Type allows**: the surface layout union in `packages/ui-kit`. Apps do not see it: the apps-engine types every surface and message as `LayoutBlock[]`.',
				'- **`ui-kit` parser**: the allowlist the `UiKitParser*` class passes to `SurfaceRenderer`. Only renderers extending that class use it (Livechat).',
				'- **Renderer renders**: the renderer allowlist plus a method for the block. Fuselage renderers extend `SurfaceRenderer` directly, so their own allowlist is the one the web client applies.',
				'',
				'`conditional` is omitted: it is unwrapped before the allowlist is checked.',
			].join('\n'),
		),
		'## Divergences',
		'',
		divergences.length ? divergences.join('\n') : 'None.',
		'',
		'## Layout blocks per surface',
		'',
		...surfaceTables,
		'## Elements per container',
		'',
		'Container columns come from the block types; renderer columns tell whether a method exists to draw the element.',
		'',
		`| ${elementColumns.join(' | ')} |`,
		`| ${elementColumns.map(() => '---').join(' | ')} |`,
		...elementRows,
		'',
	].join('\n');
};

const renderReference = () => {
	const sections = referenceSections.map(({ title, file, typeName }) => {
		const { type } = typeAlias(file, typeName);
		const byTag = new Map<string, ts.Type[]>();
		for (const member of unionMembers(type)) {
			const tag = tagOf(member) ?? typeText(member);
			byTag.set(tag, [...(byTag.get(tag) ?? []), member]);
		}
		const entries = [...byTag.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([tag, variants]) => typeSection(`\`${tag}\``, variants, declarationOf(variants[0])));
		return [`## ${title}`, '', ...entries].join('\n');
	});

	const composition = compositionObjects.map(({ file, typeName }) => {
		const { declaration, type } = typeAlias(file, typeName);
		return typeSection(typeName, [type], declaration);
	});

	const surfaceViews = views.map(({ file, typeName }) => {
		const { declaration, type } = typeAlias(file, typeName);
		return typeSection(typeName, [type], declaration);
	});

	return [
		header(
			'UiKit reference',
			'Every block, element, text object, composition object and view that `@rocket.chat/ui-kit` defines, with its fields as the types declare them. For where each one is accepted and rendered, see [support-matrix.md](support-matrix.md).',
		),
		...sections,
		'## Composition objects',
		'',
		...composition,
		'## Views',
		'',
		...surfaceViews,
	].join('\n');
};

const outputs = [
	{ path: join(outDir, 'support-matrix.md'), content: renderSupportMatrix() },
	{ path: join(outDir, 'reference.md'), content: renderReference() },
];

const check = process.argv.includes('--check');
const stale = outputs.filter(({ path, content }) => {
	let current = '';
	try {
		current = readFileSync(path, 'utf8');
	} catch {
		// a missing file counts as stale
	}
	return current !== content;
});

if (check) {
	if (stale.length) {
		console.error(
			`UiKit docs are out of date: ${stale.map(({ path }) => relative(repoRoot, path)).join(', ')}.\nRun \`yarn workspace @rocket.chat/ui-kit docs\` and commit the result.`,
		);
		process.exit(1);
	}
} else {
	for (const { path, content } of outputs) {
		writeFileSync(path, content);
	}
}
