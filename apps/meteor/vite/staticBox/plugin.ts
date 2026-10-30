import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { parseSync } from 'vite';

type Node = {
	type: string;
	start: number;
	end: number;
	[key: string]: any;
};

type DiagnosticReason = 'styling-prop-after-spread' | 'dynamic-styling-prop' | 'too-many-conditionals';

type Diagnostic = {
	file: string;
	line: number;
	column: number;
	reason: DiagnosticReason;
	prop?: string;
};

const require = createRequire(import.meta.url);
const runtimeModule = join(dirname(fileURLToPath(import.meta.url)), 'StaticBox.ts');
const virtualPrefix = 'virtual:rcx-static-box/';

// The `Box`-only props that render as class names.
const boxOnlyClassNames: Record<string, (value: unknown) => string> = {
	animated: () => 'rcx-box--animated',
	focusable: () => 'rcx-box--focusable',
	withRichContent: (value) =>
		value === 'inlineWithoutBreaks' ? 'rcx-box--with-inline-elements' : 'rcx-box--with-block-elements rcx-box--with-inline-elements',
};

const boxOnlyClassName = (name: string, value: unknown): string | undefined => {
	if (!value) return undefined;
	if (name.startsWith('rcx-')) return value === true ? name : `${name}-${value}`;
	return boxOnlyClassNames[name]?.(value);
};

const isBoxOnlyProp = (name: string) => name in boxOnlyClassNames || name.startsWith('rcx-');

// Each conditional styling prop doubles the stylesheets compiled for a `Box`.
const maxConditionals = 3;

const literalExpression = (expression: Node): { value: unknown } | undefined => {
	if (expression.type === 'Literal') return { value: expression.value };
	if (expression.type === 'Identifier' && expression.name === 'undefined') return { value: undefined };

	if (expression.type === 'UnaryExpression' && expression.operator === '-' && typeof expression.argument.value === 'number') {
		return { value: -expression.argument.value };
	}

	if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
		return { value: expression.quasis[0].value.cooked };
	}

	return undefined;
};

// The value of an attribute written as a literal
// (`mi={8}`, `display='flex'`, `withTruncatedText`), or `undefined`.
const literalValue = (value: Node | null): { value: unknown } | undefined => {
	if (!value) return { value: true };
	if (value.type === 'Literal') return { value: value.value };
	if (value.type !== 'JSXExpressionContainer') return undefined;

	return literalExpression(value.expression);
};

const walk = (node: unknown, visit: (node: Node) => void): void => {
	if (!node || typeof node !== 'object') return;

	if (Array.isArray(node)) {
		node.forEach((child) => walk(child, visit));
		return;
	}

	visit(node as Node);

	for (const value of Object.values(node)) {
		walk(value, visit);
	}
};

// Renders the `Box`es of the production build whose styling props are literals
// without the `Box` runtime: their styles are compiled into a stylesheet,
// and `StaticBox` renders the element with the class names `Box` would give it.
export const staticBox = ({ report = false }: { report?: boolean } = {}): Plugin => {
	const { extractStylingProps } = require('@rocket.chat/fuselage') as {
		extractStylingProps: (props: Record<string, unknown>) => [Record<string, unknown>, ((arg?: unknown) => string) | undefined];
	};

	const { createClassName, escapeName, transpile } = require('@rocket.chat/css-in-js');
	const { createLogicalPropertiesMiddleware } = require('@rocket.chat/stylis-logical-props-middleware');
	const { middleware, prefixer, stringify } = require('stylis');

	const transpileMiddleware = middleware([
		createLogicalPropertiesMiddleware({
			isPropertySupported: () => true,
			isPropertyValueSupported: () => true,
		}),
		prefixer,
		stringify,
	]);

	const isStylingProp = (name: string) => !(name in extractStylingProps({ [name]: undefined })[0]);

	const stylesheets = new Map<string, string>();
	const diagnostics: Diagnostic[] = [];
	let boxes = 0;
	let compiled = 0;
	let conditional = 0;

	return {
		name: 'rocketchat-static-box',
		apply: 'build',
		enforce: 'pre',

		buildStart() {
			diagnostics.length = 0;
			boxes = 0;
			compiled = 0;
			conditional = 0;
		},

		resolveId: (id) => (id.startsWith(virtualPrefix) ? id : undefined),

		load: (id) => (id.startsWith(virtualPrefix) ? stylesheets.get(id.slice(virtualPrefix.length, -'.css'.length)) : undefined),

		transform(code, id) {
			if (id.includes('?') || id.includes('/node_modules/') || !/.[jt]sx$/.test(id) || !code.includes('@rocket.chat/fuselage')) {
				return null;
			}

			const { program } = parseSync(id, code);

			const reportDiagnostic = (node: Node, reason: DiagnosticReason, prop?: string) => {
				if (!report) return;

				const lines = code.slice(0, node.start).split('\n');

				diagnostics.push({
					file: id,
					line: lines.length,
					column: lines[lines.length - 1].length,
					reason,
					prop,
				});
			};

			let box: string | undefined;

			for (const statement of program.body as Node[]) {
				if (
					statement.type !== 'ImportDeclaration' ||
					statement.source.value !== '@rocket.chat/fuselage' ||
					statement.importKind === 'type'
				) {
					continue;
				}

				for (const specifier of statement.specifiers) {
					if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'Box' && specifier.importKind !== 'type') {
						box = specifier.local.name;
					}
				}
			}

			if (!box) return null;

			const edits: { start: number; end: number; text: string }[] = [];
			const imports = new Set<string>();
			const hoisted: string[] = [];

			walk(program, (node) => {
				if (node.type !== 'JSXElement' || node.openingElement.name.type !== 'JSXIdentifier' || node.openingElement.name.name !== box) {
					return;
				}

				boxes++;

				const styling: Record<string, unknown> = {};
				const conditionals: { name: string; test: Node; values: [unknown, unknown] }[] = [];
				const stylingAttributes: Node[] = [];
				let spread = false;

				for (const attribute of node.openingElement.attributes as Node[]) {
					if (attribute.type === 'JSXSpreadAttribute') {
						spread = true;
						continue;
					}

					if (attribute.name.type !== 'JSXIdentifier') continue;

					const { name } = attribute.name;

					if (!isStylingProp(name) && !isBoxOnlyProp(name)) continue;

					// A spread can only be overridden by the props that follow it, which `StaticBox` can't tell apart from the
					// props it spreads when it falls back to `Box`.
					if (spread) {
						reportDiagnostic(attribute, 'styling-prop-after-spread', name);
						return;
					}

					const literal = literalValue(attribute.value);
					const expression = attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : undefined;

					if (literal) {
						styling[name] = literal.value;
					} else if (expression?.type === 'ConditionalExpression') {
						const consequent = literalExpression(expression.consequent);
						const alternate = literalExpression(expression.alternate);

						if (!consequent || !alternate) {
							reportDiagnostic(attribute, 'dynamic-styling-prop', name);
							return;
						}

						conditionals.push({ name, test: expression.test, values: [consequent.value, alternate.value] });
					} else {
						reportDiagnostic(attribute, 'dynamic-styling-prop', name);
						return;
					}

					stylingAttributes.push(attribute);
				}

				if (conditionals.length > maxConditionals) {
					reportDiagnostic(node, 'too-many-conditionals');
					return;
				}

				compiled++;
				if (conditionals.length) conditional++;

				const tag = '__RcxStaticBox';
				let extra = '';

				// One variant per combination of the conditional props; bit `j` of the index is set when the test of
				// conditional `j` is falsy.
				const variants = Array.from({ length: 2 ** conditionals.length }, (_, index) => {
					const props = { ...styling };

					conditionals.forEach(({ name, values }, j) => {
						props[name] = values[(index >> j) & 1];
					});

					const content = extractStylingProps(props)[1]?.();
					const classNames = Object.entries(props).map(([name, value]) => boxOnlyClassName(name, value));

					if (content) {
						const className = createClassName(content);

						stylesheets.set(className, transpile(`.${escapeName(className)}`, content, transpileMiddleware));
						imports.add(`import '${virtualPrefix}${className}.css';`);
						classNames.push(className);
					}

					const className = classNames.filter(Boolean).join(' ');

					return className ? { __rcxClassName: className, __rcxBoxProps: props } : {};
				});

				if (variants.some((variant) => variant.__rcxClassName)) {
					const constant = `__rcxStaticBox${hoisted.length}`;
					hoisted.push(`const ${constant} = ${JSON.stringify(variants)};`);

					const index = conditionals.length
						? conditionals.map(({ test }, j) => `(${code.slice(test.start, test.end)} ? 0 : ${1 << j})`).join(' | ')
						: '0';

					extra = ` {...${constant}[${index}]}`;
				}

				if (spread) extra += ' __rcxSpread';

				const { name } = node.openingElement;

				edits.push({
					start: name.start,
					end: name.end,
					text: `${tag}${extra}`,
				});

				for (const attribute of stylingAttributes) {
					edits.push({
						start: attribute.start,
						end: attribute.end,
						text: '',
					});
				}

				if (node.closingElement) {
					edits.push({
						start: node.closingElement.name.start,
						end: node.closingElement.name.end,
						text: tag,
					});
				}
			});

			if (!edits.length) return null;

			let result = code;

			for (const { start, end, text } of edits.sort((a, b) => b.start - a.start)) {
				result = result.slice(0, start) + text + result.slice(end);
			}

			// Prepended to the first line and appended after the last,
			// so every original line keeps its number.
			const header = [`import { StaticBox as __RcxStaticBox } from ${JSON.stringify(runtimeModule)};`, ...imports].join('');

			return {
				code: `${header}${result}\n${hoisted.join('\n')}\n`,
				map: null,
			};
		},

		buildEnd() {
			if (!report) return;

			const percent = boxes ? ((compiled / boxes) * 100).toFixed(1) : '0.0';

			console.log('\n[RocketChat StaticBox] Compilation diagnostics');
			console.log(`${compiled}/${boxes} Box components compiled (${percent}%), ${conditional} of them with conditional styling props.`);

			if (diagnostics.length === 0) return;

			const summary = diagnostics.reduce(
				(acc, diagnostic) => {
					acc[diagnostic.reason] = (acc[diagnostic.reason] ?? 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

			console.log(`\n${diagnostics.length} Box components could not be compiled:\n`);
			console.table(summary);

			for (const reason of Object.keys(summary)) {
				console.log(`\n${reason} (${summary[reason]}):`);

				for (const { file, line, column, prop } of diagnostics.filter((diagnostic) => diagnostic.reason === reason)) {
					console.log(`  ${relative(process.cwd(), file)}:${line}:${column + 1}${prop ? ` ${prop}` : ''}`);
				}
			}
		},
	};
};
