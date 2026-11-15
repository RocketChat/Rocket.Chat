// Keeps filters and update documents inside models: callers use named model methods instead.
// See docs/database-access.md.

const MODELS_PACKAGE = '@rocket.chat/models';

// The kind of named method that replaces each generic one, and what the caller may still pass to it
const READ = 'findOneBy<Field>(value, { projection, sort })';
const WRITE = 'set<Field>ById(_id, value, { session })';
const DELETE = 'removeBy<Field>(value, { session })';
const COUNT = 'countBy<Field>(value)';

const ALTERNATIVES = new Map([
	['find', 'findBy<Field>(value, { projection, sort, limit })'],
	['findOne', READ],
	['findPaginated', 'findPaginatedBy<Field>(value, { projection, sort, skip, limit })'],
	['aggregate', 'get<Result>By<Field>(value)'],
	['trashFind', 'trashFindBy<Field>(value, { projection })'],
	['update', WRITE],
	['updateOne', WRITE],
	['updateMany', 'set<Field>By<Selector>(selector, value, { session })'],
	['findOneAndUpdate', 'set<Field>ByIdAndReturn(_id, value, { session })'],
	['deleteOne', DELETE],
	['deleteMany', DELETE],
	['findOneAndDelete', DELETE],
	['countDocuments', COUNT],
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
			url: 'https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/database-access.md',
		},
		schema: [],
		messages: {
			method:
				"'{{model}}.{{method}}()' takes a filter or update document, which belongs inside the model. " +
				'Call a named method on {{model}} instead, e.g. {{model}}.{{alternative}}. ' +
				'If none fits, declare one on its interface in packages/model-typings and implement it in packages/models, ' +
				'named after what it selects or changes, not after this caller. See docs/database-access.md.',
			col:
				"'{{model}}.col' is the raw driver collection and bypasses the model's safeguards (_updatedAt, string _ids). " +
				'Call a named method on {{model}} instead. ' +
				"If none fits, add one in packages/models built on BaseRaw's methods. See docs/database-access.md.",
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
				const alternative = ALTERNATIVES.get(method);
				if (!alternative) return;
				if (node.parent.type === 'CallExpression' && node.parent.callee === node) {
					context.report({ node, messageId: 'method', data: { model, method, alternative } });
				}
			},
		};
	},
};
