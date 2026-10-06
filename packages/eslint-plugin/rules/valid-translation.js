import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const pluralSuffixes = ['zero', 'one', 'two', 'few', 'many', 'other'];

// Options that configure i18next itself rather than feeding an interpolation placeholder
const reservedOptions = new Set([
	'count',
	'context',
	'defaultValue',
	'lng',
	'lngs',
	'ns',
	'replace',
	'returnObjects',
	'returnDetails',
	'joinArrays',
	'postProcess',
	'interpolation',
	'formatParams',
	'keySeparator',
	'nsSeparator',
	'fallbackLng',
	'skipInterpolation',
	'ordinal',
	'sprintf',
	'appendNamespaceToMissingKey',
]);

// Options that make the final params unpredictable at lint time
const opaqueOptions = new Set(['replace', 'postProcess', 'sprintf', 'skipInterpolation']);

const isPluralObject = (value) => Object.keys(value).every((key) => pluralSuffixes.includes(key));

/** Flattens nested keys into `a.b.c` entries, keeping `{ one, other }` plural objects as the value of their key */
const flattenResource = (value, prefix = '', entries = new Map()) => {
	for (const [key, child] of Object.entries(value)) {
		const path = `${prefix}${key}`;
		if (child !== null && typeof child === 'object' && !Array.isArray(child) && !isPluralObject(child)) {
			flattenResource(child, `${path}.`, entries);
			continue;
		}
		entries.set(path, child);
	}
	return entries;
};

const cache = new Map();

/** Loads a base-language resource, reloading it when the file changes so long-lived editor servers stay accurate */
const loadResource = (localeFile, root) => {
	const { mtimeMs } = statSync(localeFile);
	const cacheKey = `${localeFile}\0${root ?? ''}`;
	const cached = cache.get(cacheKey);
	if (cached?.mtimeMs === mtimeMs) return cached.resource;

	const content = JSON.parse(readFileSync(localeFile, 'utf8'));
	const resource = flattenResource(root ? content[root] : content);
	cache.set(cacheKey, { mtimeMs, resource });
	return resource;
};

const packageCache = new Map();

/** Finds the directory of the package a file belongs to */
const findPackageDir = (directory) => {
	if (packageCache.has(directory)) return packageCache.get(directory);

	const parent = dirname(directory);
	const packageDir = existsSync(join(directory, 'package.json')) ? directory : parent !== directory && findPackageDir(parent);
	packageCache.set(directory, packageDir || undefined);
	return packageDir || undefined;
};

const readPackageJson = (packageDir) => JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));

/** Finds an installed package the way Node.js does, without going through its `exports` */
const findDependencyDir = (fromDir, name) => {
	for (let directory = fromDir; ; directory = dirname(directory)) {
		const candidate = join(directory, 'node_modules', name);
		if (existsSync(join(candidate, 'package.json'))) return candidate;
		if (dirname(directory) === directory) return undefined;
	}
};

/**
 * Reads the translations a package is written against, from the `translations` field of its `package.json`: either
 * the description of its own base-language file, or the name of the package whose translations it uses.
 */
const readTranslations = (packageDir) => {
	const { name, translations } = readPackageJson(packageDir);
	if (translations === undefined) return undefined;

	let ownerDir = packageDir;
	let description = translations;

	if (typeof translations === 'string') {
		ownerDir = findDependencyDir(packageDir, translations);
		if (!ownerDir) throw new Error(`${name}: the translations package ${translations} is not installed.`);
		description = readPackageJson(ownerDir).translations;
	}

	if (typeof description?.file !== 'string') {
		throw new Error(`${name}: \`translations\` must describe a base-language \`file\` or name a package that does.`);
	}

	const { file, root, defaultNamespace = 'translation', namespaces = [defaultNamespace] } = description;
	return { localeFile: resolve(ownerDir, file), root, defaultNamespace, namespaces };
};

const placeholderRegex = /\{\{\s*-?\s*([^,}\s]+?)\s*(?:,[^}]*)?\}\}/g;
const nestingRegex = /\$t\(\s*([^,)\s]+)/g;

const collectStrings = (value) => {
	if (typeof value === 'string') return [value];
	if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
	return [];
};

/**
 * Lists the base-language keys a lookup of `key` can resolve to. The unqualified key only belongs to the default
 * namespace, so it's a candidate only when the default namespace is being looked up.
 */
const lookupCandidates = (locale, key, namespaces) => {
	let lookupKey = key;
	let lookupNamespaces = namespaces;

	const qualifier = locale.namespaces.find((ns) => key.startsWith(`${ns}.`));
	if (qualifier) {
		lookupNamespaces = [qualifier];
		lookupKey = key.slice(qualifier.length + 1);
	}

	return lookupNamespaces.map((ns) => (ns === locale.defaultNamespace ? lookupKey : `${ns}.${lookupKey}`));
};

/**
 * Finds every base-language entry a lookup of `key` can resolve to: the entry itself, its plural forms and the
 * namespaced variants. Returns the translations of all of them.
 */
const resolveEntries = (locale, key, namespaces) => {
	const { resource } = locale;
	const found = [];
	for (const candidate of lookupCandidates(locale, key, namespaces)) {
		if (resource.has(candidate)) found.push({ key: candidate, value: resource.get(candidate) });
		for (const suffix of pluralSuffixes) {
			const pluralKey = `${candidate}_${suffix}`;
			if (resource.has(pluralKey)) found.push({ key: pluralKey, value: resource.get(pluralKey), flatPlural: true });
		}
	}
	return found;
};

/** Finds the `${key}_${context}` variants of a key, leaving out its plural forms */
const resolveContextVariants = (locale, key, namespaces) => {
	const pluralSuffixPattern = new RegExp(`^(${pluralSuffixes.join('|')})$`);
	const variants = [];
	for (const candidate of lookupCandidates(locale, key, namespaces)) {
		for (const [resourceKey, value] of locale.resource) {
			if (!resourceKey.startsWith(`${candidate}_`)) continue;
			if (pluralSuffixPattern.test(resourceKey.slice(candidate.length + 1))) continue;
			variants.push({ key: resourceKey, value });
		}
	}
	return variants;
};

const collectPlaceholders = (locale, entries, namespaces, visited = new Set()) => {
	const placeholders = new Set();

	for (const entry of entries) {
		if (visited.has(entry.key)) continue;
		visited.add(entry.key);

		for (const text of collectStrings(entry.value)) {
			for (const match of text.matchAll(placeholderRegex)) {
				placeholders.add(match[1].split('.')[0]);
			}

			// Nested translations (`$t(other.key)`) receive the options of their parent
			for (const match of text.matchAll(nestingRegex)) {
				for (const name of collectPlaceholders(locale, resolveEntries(locale, match[1], namespaces), namespaces, visited)) {
					placeholders.add(name);
				}
			}
		}
	}

	return placeholders;
};

const isPluralEntry = (entries) =>
	entries.some((entry) => entry.flatPlural || (entry.value !== null && typeof entry.value === 'object' && !Array.isArray(entry.value)));

/** Statically evaluates the possible keys an expression can hold. Returns `undefined` when it can't be known */
const staticKeys = (node) => {
	if (!node) return undefined;

	switch (node.type) {
		case 'Literal':
			return typeof node.value === 'string' ? [node.value] : undefined;
		case 'TemplateLiteral':
			return node.expressions.length === 0 ? [node.quasis[0].value.cooked] : undefined;
		case 'ConditionalExpression': {
			const consequent = staticKeys(node.consequent);
			const alternate = staticKeys(node.alternate);
			return consequent && alternate ? [...consequent, ...alternate] : undefined;
		}
		case 'LogicalExpression': {
			const left = staticKeys(node.left);
			const right = staticKeys(node.right);
			return left && right ? [...left, ...right] : undefined;
		}
		case 'TSAsExpression':
		case 'TSNonNullExpression':
		case 'TSSatisfiesExpression':
			return staticKeys(node.expression);
		default:
			return undefined;
	}
};

const propertyName = (property) => {
	if (property.type !== 'Property') return undefined;
	if (!property.computed && property.key.type === 'Identifier') return property.key.name;
	if (property.key.type === 'Literal') return String(property.key.value);
	return undefined;
};

/**
 * Reads the option names of an options object expression.
 * `names` are the statically known ones, `complete` tells whether the object has nothing else hiding in it.
 */
const readOptions = (node) => {
	const options = new Map();
	let complete = true;

	for (const property of node.properties) {
		const name = propertyName(property);
		if (name === undefined) {
			complete = false;
			continue;
		}
		options.set(name, property);
	}

	return { options, complete };
};

const staticStrings = (node) => {
	if (!node) return undefined;
	const key = staticKeys(node);
	if (key) return key;
	if (node.type === 'ArrayExpression') {
		const items = node.elements.map((element) => (element ? staticKeys(element) : undefined));
		return items.every(Boolean) ? items.flat() : undefined;
	}
	return undefined;
};

const isBackendI18nSource = (source) => typeof source === 'string' && !source.startsWith('@') && /(^|\/)i18n(\.ts)?$/.test(source);

const findVariable = (scope, name) => {
	for (let current = scope; current; current = current.upper) {
		const variable = current.set.get(name);
		if (variable) return variable;
	}
	return undefined;
};

/** Reads the namespaces handed to a `useTranslation(ns)` call */
const namespacesOf = (callNode, defaultNamespace) => {
	const namespaces = staticStrings(callNode.arguments[0]);
	return namespaces?.length ? namespaces : [defaultNamespace];
};

const isUseTranslationCall = (node) =>
	node?.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'useTranslation';

/**
 * Tells what a variable stands for: the `t` function, the `i18n` instance, or none of them.
 */
const classifyVariable = (variable, defaultNamespace) => {
	const definition = variable?.defs.at(-1);
	if (!definition) return undefined;

	if (definition.type === 'ImportBinding') {
		if (!isBackendI18nSource(definition.parent?.source?.value)) return undefined;
		const imported = definition.node.type === 'ImportSpecifier' ? definition.node.imported.name : undefined;
		if (imported === 't') return { kind: 't', namespaces: [defaultNamespace] };
		if (imported === 'i18n') return { kind: 'i18n', namespaces: [defaultNamespace] };
		return undefined;
	}

	if (definition.type !== 'Variable') return undefined;

	const declarator = definition.node;
	if (!isUseTranslationCall(declarator.init)) return undefined;
	const namespaces = namespacesOf(declarator.init, defaultNamespace);

	if (declarator.id.type === 'Identifier') return { kind: 't', namespaces };

	if (declarator.id.type === 'ObjectPattern') {
		for (const property of declarator.id.properties) {
			if (property.type !== 'Property') continue;
			const name = propertyName(property);
			const target = property.value.type === 'AssignmentPattern' ? property.value.left : property.value;
			if (target !== definition.name) continue;
			if (name === 't') return { kind: 't', namespaces };
			if (name === 'i18n') return { kind: 'i18n', namespaces };
		}
	}

	return undefined;
};

const translationsCache = new Map();

const translationsOf = (packageDir) => {
	if (!translationsCache.has(packageDir)) translationsCache.set(packageDir, readTranslations(packageDir));
	return translationsCache.get(packageDir);
};

/** @type {import('eslint').Rule.RuleModule} */
const validTranslation = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure translation keys exist in the base language and are called with exactly the parameters they declare',
		},
		schema: [],
		messages: {
			unknownKey: 'Translation key {{key}} does not exist in {{file}}.',
			missingParams: 'Translation key {{key}} requires the missing parameter(s): {{params}}.',
			extraParams: 'Translation key {{key}} does not use the parameter {{param}}.',
		},
	},
	create(context) {
		const { sourceCode } = context;
		const packageDir = findPackageDir(dirname(context.physicalFilename));
		const translations = packageDir && translationsOf(packageDir);
		if (!translations) return {};

		const { localeFile, root, defaultNamespace, namespaces: fileNamespaces } = translations;
		const locale = { resource: loadResource(localeFile, root), defaultNamespace, namespaces: fileNamespaces };
		const file = basename(localeFile);

		const validate = ({ keyNode, optionsNode, hasExtraArguments, hasDefaults, namespaces, explicitCount, reportNode }) => {
			const keys = staticKeys(keyNode);
			if (!keys) return;

			const parsed = optionsNode?.type === 'ObjectExpression' ? readOptions(optionsNode) : undefined;
			const hasContext = parsed?.options.has('context') ?? false;
			const hasDefaultValue = hasDefaults || (parsed?.options.has('defaultValue') ?? false);

			for (const key of keys) {
				// App translations are registered at runtime and can't be known from the base language
				if (/^app-[^.]+\./.test(key)) continue;

				let entries = resolveEntries(locale, key, namespaces);
				let selectedByContext = false;

				if (hasContext) {
					// i18next prefers the `${key}_${context}` variant and falls back to the plain key
					const contextValues = staticKeys(parsed.options.get('context').value);
					if (contextValues) {
						const variants = contextValues.flatMap((value) => resolveEntries(locale, `${key}_${value}`, namespaces));
						if (variants.length) entries = variants;
					} else {
						const variants = resolveContextVariants(locale, key, namespaces);
						if (variants.length) {
							// Which variant applies is unknown, so params can only be checked for extras
							selectedByContext = true;
							entries = [...entries, ...variants];
						}
					}
				}

				if (!entries.length) {
					if (!hasDefaultValue) {
						context.report({ node: keyNode, messageId: 'unknownKey', data: { key: JSON.stringify(key), file } });
					}
					continue;
				}

				// Params can only be verified when the call site is fully literal
				if (hasExtraArguments) continue;
				if (optionsNode && !parsed) continue;
				if (parsed && [...opaqueOptions].some((name) => parsed.options.has(name))) continue;

				const declared = collectPlaceholders(locale, entries, namespaces);
				if (isPluralEntry(entries)) declared.add('count');

				const provided = new Set(parsed?.options.keys() ?? []);
				if (explicitCount) provided.add('count');

				if (!selectedByContext && (!parsed || parsed.complete)) {
					const missing = [...declared].filter((name) => !provided.has(name));
					if (missing.length) {
						context.report({
							node: reportNode ?? optionsNode ?? keyNode,
							messageId: 'missingParams',
							data: { key: JSON.stringify(key), params: missing.map((name) => JSON.stringify(name)).join(', ') },
						});
					}
				}

				for (const [name, property] of parsed?.options ?? []) {
					if (reservedOptions.has(name) || name.startsWith('defaultValue_') || declared.has(name)) continue;
					context.report({
						node: property,
						messageId: 'extraParams',
						data: { key: JSON.stringify(key), param: JSON.stringify(name) },
					});
				}
			}
		};

		const classify = (identifier) => classifyVariable(findVariable(sourceCode.getScope(identifier), identifier.name), defaultNamespace);

		return {
			CallExpression(node) {
				let target;

				if (node.callee.type === 'Identifier') {
					target = classify(node.callee);
					if (target?.kind !== 't') return;
				} else if (
					node.callee.type === 'MemberExpression' &&
					!node.callee.computed &&
					node.callee.object.type === 'Identifier' &&
					node.callee.property.name === 't'
				) {
					target = classify(node.callee.object);
					if (target?.kind !== 'i18n') return;
				} else {
					return;
				}

				if (node.arguments.some((argument) => argument.type === 'SpreadElement')) return;

				const [keyNode, optionsNode] = node.arguments;
				validate({
					keyNode,
					optionsNode,
					hasExtraArguments: node.arguments.length > 2,
					namespaces: target.namespaces,
					reportNode: optionsNode ?? node,
				});
			},

			JSXOpeningElement(node) {
				if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'Trans') return;

				const variable = findVariable(sourceCode.getScope(node), 'Trans');
				const definition = variable?.defs.at(-1);
				if (definition?.type !== 'ImportBinding' || definition.parent?.source?.value !== 'react-i18next') return;

				const attributes = new Map();
				let hasSpread = false;
				for (const attribute of node.attributes) {
					if (attribute.type === 'JSXSpreadAttribute') {
						hasSpread = true;
						continue;
					}
					attributes.set(attribute.name.name, attribute);
				}

				const unwrap = (attribute) => (attribute?.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : attribute?.value);

				const keyNode = unwrap(attributes.get('i18nKey'));
				if (!keyNode) return;

				// `defaults` is the fallback text, same as `defaultValue` for `t()`
				const hasDefaults = attributes.has('defaults');

				const valuesNode = unwrap(attributes.get('values'));
				const namespaces = staticStrings(unwrap(attributes.get('ns'))) ?? [defaultNamespace];

				validate({
					keyNode,
					// Params can't be verified when they may come from spread props, `tOptions` or a dynamic `values`
					optionsNode: valuesNode ?? { type: 'ObjectExpression', properties: [] },
					hasDefaults,
					hasExtraArguments:
						hasSpread || attributes.has('tOptions') || attributes.has('context') || (valuesNode && valuesNode.type !== 'ObjectExpression'),
					namespaces,
					explicitCount: attributes.has('count'),
					reportNode: node,
				});
			},
		};
	},
};

export default validTranslation;
