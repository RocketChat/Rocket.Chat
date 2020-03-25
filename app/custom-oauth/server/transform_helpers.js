import _ from 'underscore';

const IDENTITY_PROPNAME_FILTER = /(\.)/g;
export const renameInvalidProperties = (input) => {
	if (Array.isArray(input)) {
		return input.map(renameInvalidProperties);
	}
	if (!_.isObject(input)) {
		return input;
	}

	return Object.entries(input).reduce((result, [name, value]) => ({
		...result,
		[name.replace(IDENTITY_PROPNAME_FILTER, '_')]: renameInvalidProperties(value),
	}), {});
};

export const getNestedValue = (propertyPath, source) =>
	propertyPath.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), source);

// /^(.+)@/::email
const REGEXP_FROM_FORMULA = /^\/((?!\/::).*)\/::(.+)/;
export const getRegexpMatch = (formula, data) => {
	const regexAndPath = REGEXP_FROM_FORMULA.exec(formula);
	if (!regexAndPath) {
		return getNestedValue(formula, data);
	}
	if (regexAndPath.length !== 3) {
		throw new Error(`expected array of length 3, got ${ regexAndPath.length }`);
	}

	const [, regexString, path] = regexAndPath;
	const nestedValue = getNestedValue(path, data);
	const regex = new RegExp(regexString);
	const matches = regex.exec(nestedValue);

	// regexp does not match nested value
	if (!matches) {
		return undefined;
	}

	// we only support regular expressions with a single capture group
	const [, value] = matches;

	// this could mean we return `undefined` (e.g. when capture group is empty)
	return value;
};

const templateStringRegex = /{{((?:(?!}}).)+)}}/g;
export const fromTemplate = (template, data) => {
	if (!templateStringRegex.test(template)) {
		return getNestedValue(template, data);
	}

	return template.replace(templateStringRegex, (fullMatch, match) => getRegexpMatch(match, data));
};
