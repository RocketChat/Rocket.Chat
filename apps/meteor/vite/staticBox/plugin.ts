import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { parseSync } from 'vite';

type Node = { type: string; start: number; end: number; [key: string]: any };

const require = createRequire(import.meta.url);
const runtimeModule = join(dirname(fileURLToPath(import.meta.url)), 'StaticBox.ts');
const virtualPrefix = 'virtual:rcx-static-box/';

const boxOnlyProps = new Set(['animated', 'withRichContent', 'htmlSize', 'focusable']);

// The value of an attribute written as a literal (`mi={8}`, `display='flex'`, `withTruncatedText`), or `undefined`.
const literalValue = (value: Node | null): { value: unknown } | undefined => {
	if (!value) return { value: true };
	if (value.type === 'Literal') return { value: value.value };
	if (value.type !== 'JSXExpressionContainer') return undefined;

	const { expression } = value;
	if (expression.type === 'Literal') return { value: expression.value };
	if (expression.type === 'UnaryExpression' && expression.operator === '-' && typeof expression.argument.value === 'number') {
		return { value: -expression.argument.value };
	}
	if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) return { value: expression.quasis[0].value.cooked };

	return undefined;
};

const walk = (node: unknown, visit: (node: Node) => void): void => {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		node.forEach((child) => walk(child, visit));
		return;
	}

	visit(node as Node);
	for (const value of Object.values(node)) walk(value, visit);
};

// Renders the `Box`es of the production build whose styling props are literals without the `Box` runtime: their styles
// are compiled into a stylesheet, and `StaticBox` renders the element with the class names `Box` would give it.
export const staticBox = (): Plugin => {
	const { extractStylingProps } = require('@rocket.chat/fuselage') as {
		extractStylingProps: (props: Record<string, unknown>) => [Record<string, unknown>, ((arg?: unknown) => string) | undefined];
	};
	const { createClassName, escapeName, transpile } = require('@rocket.chat/css-in-js');
	const { createLogicalPropertiesMiddleware } = require('@rocket.chat/stylis-logical-props-middleware');
	const { middleware, prefixer, stringify } = require('stylis');

	// The browsers the build targets all support logical properties, which the runtime checks one by one.
	const transpileMiddleware = middleware([
		createLogicalPropertiesMiddleware({ isPropertySupported: () => true, isPropertyValueSupported: () => true }),
		prefixer,
		stringify,
	]);

	const isStylingProp = (name: string) => !(name in extractStylingProps({ [name]: undefined })[0]);
	const stylesheets = new Map<string, string>();

	return {
		name: 'rocketchat-static-box',
		apply: 'build',
		enforce: 'pre',
		resolveId: (id) => (id.startsWith(virtualPrefix) ? id : undefined),
		load: (id) => (id.startsWith(virtualPrefix) ? stylesheets.get(id.slice(virtualPrefix.length, -'.css'.length)) : undefined),
		transform(code, id) {
			if (id.includes('?') || id.includes('/node_modules/') || !/\.[jt]sx$/.test(id) || !code.includes('@rocket.chat/fuselage')) {
				return null;
			}

			const { program } = parseSync(id, code);

			let box: string | undefined;
			for (const statement of program.body as Node[]) {
				if (statement.type !== 'ImportDeclaration' || statement.source.value !== '@rocket.chat/fuselage' || statement.importKind === 'type') {
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

				const styling: Record<string, unknown> = {};
				const stylingAttributes: Node[] = [];

				for (const attribute of node.openingElement.attributes as Node[]) {
					if (attribute.type === 'JSXSpreadAttribute') return;
					if (attribute.name.type !== 'JSXIdentifier') continue;

					const { name } = attribute.name;
					if (boxOnlyProps.has(name) || name.startsWith('rcx-')) return;

					if (name === 'className') {
						if (typeof literalValue(attribute.value)?.value !== 'string') return;
						continue;
					}

					if (!isStylingProp(name)) continue;

					const literal = literalValue(attribute.value);
					if (!literal) return;

					styling[name] = literal.value;
					stylingAttributes.push(attribute);
				}

				const tag = '__RcxStaticBox';
				let extra = '';

				const [, styles] = extractStylingProps(styling);
				const content = styles?.();
				if (content) {
					const className = createClassName(content);
					stylesheets.set(className, transpile(`.${escapeName(className)}`, content, transpileMiddleware));
					imports.add(`import '${virtualPrefix}${className}.css';`);

					const constant = `__rcxStylingProps${hoisted.length}`;
					hoisted.push(`const ${constant} = ${JSON.stringify(styling)};`);
					extra = ` __rcxClassName="${className}" __rcxStylingProps={${constant}}`;
				}

				const { name } = node.openingElement;
				edits.push({ start: name.start, end: name.end, text: `${tag}${extra}` });
				for (const attribute of stylingAttributes) edits.push({ start: attribute.start, end: attribute.end, text: '' });
				if (node.closingElement) {
					edits.push({ start: node.closingElement.name.start, end: node.closingElement.name.end, text: tag });
				}
			});

			if (!edits.length) return null;

			let result = code;
			for (const { start, end, text } of edits.sort((a, b) => b.start - a.start)) {
				result = result.slice(0, start) + text + result.slice(end);
			}

			// Prepended to the first line and appended after the last, so every original line keeps its number.
			const header = [`import { StaticBox as __RcxStaticBox } from ${JSON.stringify(runtimeModule)};`, ...imports].join('');
			return { code: `${header}${result}\n${hoisted.join('\n')}\n`, map: null };
		},
	};
};
