import fs from 'fs';
import path from 'path';

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

const pipe =
	(...fns) =>
	(y, ...x) =>
		fns.reduce((v, f) => {
			return f(v, ...x);
		}, y);

export const normalizeI18nInterpolations = (dictionary, language, cb) => {
	const result = pipe(
		replaceNullValues,
		replaceI18nInterpolations,
		replaceI18nextComponentsArrayInterpolations,
		replaceSprintfInterpolations,
	)(dictionary, language, cb);

	return result;
};

// read all files in the current directory

const files = fs.readdirSync(`./src/locales`);
const stats = {
	alreadyGenerated: false,
	__: {
		total: 0,
		keys: [],
	},
	sprintf: {
		total: 0,
		keys: [],
	},
	i18nextComponentsArray: {
		total: 0,
		keys: [],
	},
	nullValues: {
		total: 0,
		keys: [],
	},
};

const recordStatIfNotAlready = (statKey, row) => {
	if (stats.alreadyGenerated) {
		return;
	}
	stats[statKey].total++;
	stats[statKey].keys.push(row);
};

const interpolationReplacementsStats = () =>
	`Number of keys using __ and replaced by native i18next interpolation('{{' '}}') key: ${stats.__.total} keys
Number of keys with (explicit) null values: ${stats.nullValues.total} keys
Number of keys using sprintf: ${stats.sprintf.total} keys
Number of keys using i18next components array (<number></number>): ${stats.i18nextComponentsArray.total} keys

(explicit) null values: ${JSON.stringify(stats.nullValues.keys, null, 2)}
==================================================
__ : ${JSON.stringify(stats.__.keys, null, 2)}

==================================================
sprintf : ${JSON.stringify(stats.sprintf.keys, null, 2)}

==================================================

i18nextComponentsArray : ${JSON.stringify(stats.i18nextComponentsArray.keys, null, 2)}
`;

export const normalizeI18nInterpolationsTask = pipe(normalizeI18nInterpolations, (result, _, cb) => {
	stats.alreadyGenerated = Boolean(cb);
	return result;
});

const generateJSONContents = (files) =>
	files
		.map((file) => {
			// read the file contents

			const key = path.basename(file, '.i18n.json');
			const parsedJson = JSON.parse(fs.readFileSync(`./src/locales/${file}`, 'utf8'));
			return `\n"${key}":${JSON.stringify(
				normalizeI18nInterpolationsTask(parsedJson, key, key === 'en' ? recordStatIfNotAlready : undefined),
				null,
				2,
			)}`;
		})
		.join(',');

const contents = generateJSONContents(files);

const esm = `export default {
	${contents}
`;

const cjs = `module.exports = {
	${contents}
`;

const keys = Object.keys(JSON.parse(fs.readFileSync(`./src/locales/en.i18n.json`, 'utf8')));

const tds = `export interface RocketchatI18n {
	${keys.map((key) => `${JSON.stringify(key)}: string;`).join('\n\t')}
}

export declare const dict: Record<string, RocketchatI18nKeys>;

export type RocketchatI18nKeys = keyof RocketchatI18n;
`;

// write the files
fs.rmdirSync(`./dist`, { recursive: true });
fs.mkdirSync(`./dist`, { recursive: true });
fs.writeFileSync(`./dist/index.mjs`, esm);
fs.writeFileSync(`./dist/index.js`, cjs);
fs.writeFileSync(`./dist/index.d.ts`, tds);
fs.writeFileSync(`./dist/stats.txt`, interpolationReplacementsStats());
