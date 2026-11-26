// Enforce the spread contract required by zero-runtime Fuselage frames.

const isStyledCall = (node) => {
	if (node?.type !== 'CallExpression') return false;
	return node.callee.type === 'Identifier' && node.callee.name === 'styled';
};

const renderedElements = (expression) => {
	switch (expression?.type) {
		case 'JSXElement':
			return [expression];
		case 'ConditionalExpression':
			return [...renderedElements(expression.consequent), ...renderedElements(expression.alternate)];
		case 'LogicalExpression':
			return [...renderedElements(expression.left), ...renderedElements(expression.right)];
		default:
			return [];
	}
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'A frame takes no spread except of a frame-safe call, and the element it renders takes a spread only of a safe call: zero-runtime lets the frame className overwrite the spread, the runtime joins both',
		},
		schema: [
			{
				type: 'object',
				properties: {
					// Calls that return a closed list of attributes without a className, such as ariaAndDataAttributes
					safeCalls: { type: 'array', items: { type: 'string' } },
					// Calls whose handlers belong on the frame itself, such as pickFramePressHandlers
					frameSafeCalls: { type: 'array', items: { type: 'string' } },
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
		const { sourceCode } = context;
		const safeCalls = new Set(context.options[0]?.safeCalls ?? []);
		const frameSafeCalls = new Set(context.options[0]?.frameSafeCalls ?? []);
		const frames = new Set();
		const spreads = [];

		const isCallOf = (names, expression) =>
			expression?.type === 'CallExpression' && expression.callee.type === 'Identifier' && names.has(expression.callee.name);
		const isSafeSpread = (expression) => isCallOf(safeCalls, expression);

		const bindingOf = (name, node) => {
			for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
				const variable = scope.set.get(name);
				if (variable) return variable;
			}
			return undefined;
		};

		return {
			'VariableDeclarator'(node) {
				if (node.id.type !== 'Identifier' || !isStyledCall(node.init)) return;
				for (const variable of sourceCode.getDeclaredVariables(node)) frames.add(variable);
			},
			'JSXOpeningElement'(node) {
				if (node.name.type !== 'JSXIdentifier') return;
				for (const attribute of node.attributes) {
					if (attribute.type === 'JSXSpreadAttribute') spreads.push({ binding: bindingOf(node.name.name, node), attribute });
				}
			},
			'JSXAttribute'(node) {
				if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'render') return;
				if (node.value?.type !== 'JSXExpressionContainer') return;

				for (const element of renderedElements(node.value.expression)) {
					for (const attribute of element.openingElement.attributes) {
						if (attribute.type === 'JSXSpreadAttribute' && !isSafeSpread(attribute.argument)) {
							context.report({ node: attribute, messageId: 'renderSpread' });
						}
					}
				}
			},
			// A frame can be declared below the component that renders it
			'Program:exit'() {
				for (const { binding, attribute } of spreads) {
					if (binding && frames.has(binding) && !isCallOf(frameSafeCalls, attribute.argument)) {
						context.report({ node: attribute, messageId: 'frameSpread' });
					}
				}
			},
		};
	},
};
