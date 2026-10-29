// The Fuselage spacing scale, in pixels
const SCALE = [4, 8, 12, 16, 20, 24, 32, 40];

const SPACING_PROP = /^(?:(?:margin|padding)(?:Block|Inline)?(?:Start|End)?|gap|rowGap|columnGap)$/;
const MARGINS_PROP = /^(?:all|block|inline|blockStart|blockEnd|inlineStart|inlineEnd)$/;

const literalValues = (node) => {
	if (!node) return [];
	switch (node.type) {
		case 'Literal':
			return typeof node.value === 'string' || typeof node.value === 'number' ? [{ node, value: node.value }] : [];
		case 'UnaryExpression':
			return (node.operator === '-' || node.operator === '+') && node.argument.type === 'Literal' && typeof node.argument.value === 'number'
				? [{ node, value: node.operator === '-' ? -node.argument.value : node.argument.value }]
				: [];
		case 'TemplateLiteral':
			return node.expressions.length === 0 ? [{ node, value: node.quasis[0].value.cooked }] : [];
		case 'ConditionalExpression':
			return [...literalValues(node.consequent), ...literalValues(node.alternate)];
		case 'LogicalExpression':
			return [...literalValues(node.left), ...literalValues(node.right)];
		case 'JSXExpressionContainer':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
			return literalValues(node.expression);
		default:
			return [];
	}
};

const ALLOWED = new Set([0, '0', 'none', 'auto', ...SCALE.flatMap((step) => [`x${step}`, `neg-x${step}`, `-x${step}`])]);

const toPixels = (value) => {
	if (typeof value === 'number') return value;
	const px = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
	return px ? Number(px[1]) : null;
};

const tokenFor = (pixels) => (SCALE.includes(Math.abs(pixels)) ? `${pixels < 0 ? 'neg-' : ''}x${Math.abs(pixels)}` : null);

const elementName = (name) => {
	if (name.type === 'JSXIdentifier') return name.name;
	if (name.type === 'JSXMemberExpression') return name.property.name;
	return '';
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Keep spacing props and spacing() calls on Fuselage spacing tokens',
		},
		schema: [
			{
				type: 'object',
				properties: {
					ignoreComponents: { type: 'array', items: { type: 'string' } },
				},
				additionalProperties: false,
			},
		],
		messages: {
			offScale: '{{ value }} is not a spacing token. Use x4, x8, x12, x16, x20, x24, x32 or x40 (or a negative), 0, none or auto.',
			useToken: "{{ value }} is not a spacing token. Use '{{ token }}'.",
		},
	},
	create(context) {
		const ignoreComponents = new Set(context.options[0]?.ignoreComponents ?? []);

		const check = (expression) => {
			for (const { node, value } of literalValues(expression)) {
				if (ALLOWED.has(value)) continue;
				const pixels = toPixels(value);
				const token = pixels === null ? null : tokenFor(pixels);
				const data = { value: JSON.stringify(value), token };
				context.report({ node, messageId: token ? 'useToken' : 'offScale', data });
			}
		};

		return {
			JSXOpeningElement(node) {
				const name = elementName(node.name);
				if (!/^[A-Z]/.test(name) || ignoreComponents.has(name)) return;

				for (const attribute of node.attributes) {
					if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
					const prop = attribute.name.name;
					if (SPACING_PROP.test(prop) || (name === 'Margins' && MARGINS_PROP.test(prop))) check(attribute.value);
				}
			},
			CallExpression(node) {
				if (node.callee.type === 'Identifier' && node.callee.name === 'spacing') check(node.arguments[0]);
			},
		};
	},
};
