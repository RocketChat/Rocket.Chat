// Keeps filters and update documents inside models: callers use named model methods instead.
// See docs/database-access.md.

const MODELS_PACKAGE = '@rocket.chat/models';

const GENERIC_METHODS = new Set([
	'find',
	'findOne',
	'findPaginated',
	'update',
	'updateOne',
	'updateMany',
	'findOneAndUpdate',
	'findOneAndDelete',
	'deleteOne',
	'deleteMany',
	'countDocuments',
	'aggregate',
	'trashFind',
]);

const propertyName = (member) => {
	if (!member.computed && member.property.type === 'Identifier') return member.property.name;
	if (member.computed && member.property.type === 'Literal' && typeof member.property.value === 'string') return member.property.value;
	return null;
};

const unwrap = (node) => {
	while (node && (node.type === 'TSNonNullExpression' || node.type === 'TSAsExpression')) {
		node = node.expression;
	}
	return node;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow generic collection methods on models from @rocket.chat/models outside a model',
		},
		schema: [],
		messages: {
			method: "Don't call '{{model}}.{{method}}()' outside a model. Add a named method to the model instead (docs/database-access.md).",
			col: "Don't use '{{model}}.col' outside a model. Add a named method to the model instead (docs/database-access.md).",
		},
	},
	create(context) {
		const models = new Set();
		const namespaces = new Set();

		const modelName = (node) => {
			node = unwrap(node);
			if (!node) return null;
			if (node.type === 'Identifier') return models.has(node.name) ? node.name : null;
			if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && namespaces.has(node.object.name)) {
				return propertyName(node);
			}
			return null;
		};

		return {
			ImportDeclaration(node) {
				if (node.source.value !== MODELS_PACKAGE || node.importKind === 'type') return;
				for (const specifier of node.specifiers) {
					if (specifier.importKind === 'type') continue;
					if (specifier.type === 'ImportSpecifier') models.add(specifier.local.name);
					else namespaces.add(specifier.local.name);
				}
			},
			MemberExpression(node) {
				if (models.size === 0 && namespaces.size === 0) return;
				const method = propertyName(node);
				if (!method) return;
				const model = modelName(node.object);
				if (!model) return;
				if (method === 'col') {
					context.report({ node, messageId: 'col', data: { model } });
					return;
				}
				if (!GENERIC_METHODS.has(method)) return;
				if (node.parent.type === 'CallExpression' && node.parent.callee === node) {
					context.report({ node, messageId: 'method', data: { model, method } });
				}
			},
		};
	},
};
