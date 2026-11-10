// `style` is left alone: the zero-runtime compiler refuses a frame with a render element that sets its own `style`, so
// nothing overwrites the element's, and a frame's open values reach it as custom properties through that spread.
const CARRIED = 'className';

const propertyName = (property) => {
	if (property.type !== 'Property') return null;
	if (property.key.type === 'Identifier') return property.key.name;
	if (property.key.type === 'Literal') return String(property.key.value);
	return null;
};

const bindingsIn = (node) => {
	switch (node.type) {
		case 'FunctionDeclaration':
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
			return [
				...node.params.map((param) => ({ id: param.type === 'AssignmentPattern' ? param.left : param, init: null })),
				...bindingsIn(node.body),
			];
		case 'BlockStatement':
		case 'Program':
			return node.body.flatMap((statement) => (statement.type === 'VariableDeclaration' ? statement.declarations : []));
		default:
			return [];
	}
};

// The keys an object pattern (or one nested in it) takes out before a rest named `name`
const restOf = (pattern, name) => {
	if (pattern?.type === 'AssignmentPattern') return restOf(pattern.left, name);
	if (pattern?.type !== 'ObjectPattern') return null;
	for (const property of pattern.properties) {
		if (property.type === 'RestElement') {
			if (property.argument.type === 'Identifier' && property.argument.name === name) {
				return pattern.properties.map(propertyName).filter(Boolean);
			}
		} else {
			const nested = restOf(property.value, name);
			if (nested) return nested;
		}
	}
	return null;
};

// How `name` is bound where `node` reads it: as the rest of an object pattern, or to an initializer
const findBinding = (node, name) => {
	for (let scope = node.parent; scope; scope = scope.parent) {
		for (const { id, init } of bindingsIn(scope)) {
			if (id.type === 'Identifier' && id.name === name) return { init };
			const keys = restOf(id, name);
			if (keys) return { restOf: keys };
		}
	}
	return null;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				"Keep className out of a spread on a frame's render element: zero-runtime lets the frame's className overwrite it, the runtime joins both",
		},
		schema: [
			{
				type: 'object',
				properties: {
					// Calls that return attributes without a className, such as ariaAndDataAttributes
					safeCalls: { type: 'array', items: { type: 'string' } },
				},
				additionalProperties: false,
			},
		],
		messages: {
			mayCarry:
				"This spread on a render element may carry a className, which the compiled frame drops. Take it out by name (`const { className, ...rest } = props`) and join it into the frame's className.",
		},
	},
	create(context) {
		const safeCalls = new Set(context.options[0]?.safeCalls ?? []);

		const isSafe = (expression, seen = new Set()) => {
			switch (expression?.type) {
				case 'CallExpression': {
					if (expression.callee.type !== 'Identifier') return false;
					if (safeCalls.has(expression.callee.name)) return true;
					// A local arrow function that returns an object literal
					const init = findBinding(expression, expression.callee.name)?.init;
					return init?.type === 'ArrowFunctionExpression' && init.body.type !== 'BlockStatement' && isSafe(init.body, seen);
				}
				case 'Literal':
					return true;
				case 'LogicalExpression':
					// `…(condition && { … })` only ever spreads its right side: a falsy left side spreads nothing
					return (expression.operator === '&&' || isSafe(expression.left, seen)) && isSafe(expression.right, seen);
				case 'ConditionalExpression':
					return isSafe(expression.consequent, seen) && isSafe(expression.alternate, seen);
				case 'TSAsExpression':
				case 'TSSatisfiesExpression':
					return isSafe(expression.expression, seen);
				case 'ObjectExpression':
					return expression.properties.every((property) =>
						property.type === 'SpreadElement' ? isSafe(property.argument, seen) : propertyName(property) !== CARRIED,
					);
				case 'Identifier': {
					if (seen.has(expression.name)) return false;
					seen.add(expression.name);
					const binding = findBinding(expression, expression.name);
					if (binding?.restOf) return binding.restOf.includes(CARRIED);
					return Boolean(binding?.init) && isSafe(binding.init, seen);
				}
				default:
					return false;
			}
		};

		return {
			JSXAttribute(node) {
				if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'render') return;
				const element = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : null;
				if (element?.type !== 'JSXElement') return;

				for (const attribute of element.openingElement.attributes) {
					if (attribute.type === 'JSXSpreadAttribute' && !isSafe(attribute.argument)) {
						context.report({ node: attribute, messageId: 'mayCarry' });
					}
				}
			},
		};
	},
};
