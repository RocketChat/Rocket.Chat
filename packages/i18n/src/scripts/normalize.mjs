const replacements = {
	__: {
		regex: /__(.*?)__/g,
		replacement: '{{$1}}',
	},
	sprintf: {
		regex: /%[0-9]*[.]?[0-9]*[a-z]/g,
		replacement: undefined,
	},
	i18nextComponentsArray: {
		regex: /<(\d+?)>(.+?)<\/\1>/g,
		replacement: undefined,
	},
};

const replaceI18nInterpolation = (translation) => {
	if (!translation) {
		return [undefined, false];
	}
	const exist = translation?.match(replacements.__.regex);
	return [translation?.replace(replacements.__.regex, replacements.__.replacement), Boolean(exist)];
};

const replaceSprintfInterpolation = (translation) => {
	const exist = translation?.match(replacements.sprintf.regex);

	return [undefined, Boolean(exist)];
};

const replaceI18nextComponentsArrayInterpolation = (translation) => {
	const exist = translation?.match(replacements.i18nextComponentsArray.regex);
	return [undefined, Boolean(exist)];
};

const replaceNullValuesInterpolation = (translation) => {
	return [undefined, translation === null];
};

const generator = (fn, id) => (dictionary, language, cb) => {
	return Object.entries(dictionary).reduce((dic, [key, value]) => {
		const [replacement, exist] = fn(value);
		if (exist) {
			cb?.(id, { language, key });
		}
		if (replacement) {
			dic[key] = replacement;
		}
		return dic;
	}, dictionary);
};

const replaceI18nInterpolations = generator(replaceI18nInterpolation, '__');

const replaceSprintfInterpolations = generator(replaceSprintfInterpolation, 'sprintf');

const replaceI18nextComponentsArrayInterpolations = generator(replaceI18nextComponentsArrayInterpolation, 'i18nextComponentsArray');

const replaceNullValues = generator(replaceNullValuesInterpolation, 'nullValues');

const replaceNestedPlurals = (dictionary, language, cb) => {
	const entries = [];
	const plurals = ['zero', 'one', 'two', 'few', 'many', 'other'];

	for (const [key, translation] of Object.entries(dictionary).toSorted(([a], [b]) => a.localeCompare(b))) {
		if (typeof translation === 'string') {
			entries.push([key, translation]);
		} else if (typeof translation === 'object' && translation !== null) {
			const existingKeys = new Set(Object.keys(translation));
			const exceedingKeys = existingKeys.difference(new Set(plurals));
			if (exceedingKeys.size > 0) console.error(`Invalid plurals in key "${key}" found: ${Array.from(exceedingKeys).join(', ')}`);

			for (const plural of plurals) {
				if (!(plural in translation)) continue;

				entries.push([`${key}_${plural}`, translation[plural]]);
			}
			cb?.('nestedPlurals', { language, key });
		}
	}

	return Object.fromEntries(entries);
};

export const pipe =
	(...fns) =>
	(y, ...x) =>
		fns.reduce((v, f) => {
			return f(v, ...x);
		}, y);

export const normalizeI18nInterpolations = (dictionary, language, cb) => {
	const result = pipe(
		replaceNestedPlurals,
		replaceNullValues,
		replaceI18nInterpolations,
		replaceI18nextComponentsArrayInterpolations,
		replaceSprintfInterpolations,
	)(dictionary, language, cb);

	return result;
};
