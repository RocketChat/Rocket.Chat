// `style` is left alone: the zero-runtime compiler refuses a frame with a render element that sets its own `style`, so
// nothing overwrites the element's, and a frame's open values reach it as custom properties through that spread.

const isStyledCall = (node) => {
	if (node?.type !== 'CallExpression') return false;
	return node.callee.type === 'Identifier' && node.callee.name === 'styled';
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'A frame takes no spread, and the element it renders takes a spread only of a safe call: zero-runtime lets the frame className overwrite the spread, the runtime joins both',
		},
		schema: [
			{
				type: 'object',
				properties: {
					// Calls that return a closed list of attributes without a className, such as ariaAndDataAttributes
					safeCalls: { type: 'array', items: { type: 'string' } },
				},
				additionalProperties: false,
			},
		],
		messages: {
			frameSpread: 'A frame takes only its variants, `className` and `children`: pass each one by name, never `{...props}`.',
			renderSpread:
				'Only a safe call (`ariaAndDataAttributes`, a `pick…Handlers` helper) may be spread on a render element: anything else may carry a `className`, which the compiled frame drops.',
		},
	},
	create(context) {
		const safeCalls = new Set(context.options[0]?.safeCalls ?? []);
		const frames = new Set();
		const spreads = [];

		const isSafeSpread = (expression) =>
			expression?.type === 'CallExpression' && expression.callee.type === 'Identifier' && safeCalls.has(expression.callee.name);

		return {
			'VariableDeclarator'(node) {
				if (node.id.type === 'Identifier' && isStyledCall(node.init)) frames.add(node.id.name);
			},
			'JSXOpeningElement'(node) {
				if (node.name.type !== 'JSXIdentifier') return;
				for (const attribute of node.attributes) {
					if (attribute.type === 'JSXSpreadAttribute') spreads.push({ element: node.name.name, attribute });
				}
			},
			'JSXAttribute'(node) {
				if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'render') return;
				const element = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : null;
				if (element?.type !== 'JSXElement') return;

				for (const attribute of element.openingElement.attributes) {
					if (attribute.type === 'JSXSpreadAttribute' && !isSafeSpread(attribute.argument)) {
						context.report({ node: attribute, messageId: 'renderSpread' });
					}
				}
			},
			// A frame can be declared below the component that renders it
			'Program:exit'() {
				for (const { element, attribute } of spreads) {
					if (frames.has(element)) context.report({ node: attribute, messageId: 'frameSpread' });
				}
			},
		};
	},
};
