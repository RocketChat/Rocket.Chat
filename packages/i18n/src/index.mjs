import fs from 'fs';
import path from 'path';

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

const extractLanguageNameFromFileName = (fileName) => {
	return fileName.split('.')?.[0] || '';
};

const recordStatIfNotAlready = (statKey, row) => {
	if (stats.alreadyGenerated) {
		return;
	}
	stats[statKey].total++;
	stats[statKey].keys.push(row);
};

export const normalizeI18nInterpolations = (fileContents, language) => {
	const allLangs = files.map((filename) => extractLanguageNameFromFileName(filename));
	if (!allLangs.includes(language)) {
		throw new Error('Language not supported');
	}

	const result = Object.keys(fileContents).reduce((acc, key) => {
		const value = fileContents[key];
		if (!value) {
			recordStatIfNotAlready('nullValues', { language, key });
			return acc;
		}
		Object.keys(replacements).forEach((replacementKey) => {
			const { regex, replacement } = replacements[replacementKey];
			const exist = value.match(regex);
			if (!replacement) {
				if (exist) {
					recordStatIfNotAlready(replacementKey, { language, key });
				}
				return acc;
			}
			if (exist) {
				recordStatIfNotAlready(replacementKey, { language, key });
				acc[key] = value.replace(regex, replacement);
			} else {
				acc[key] = value;
			}
		});
		return acc;
	}, {});

	stats.alreadyGenerated = true;

	return result;
};

const interpolationReplacementsStats = () =>
	`Number of keys using __ and replaced by native i18next interpolation('{{' '}}') key: ${stats.__.total} keys
		Number of keys with (explicit) null values: ${stats.nullValues.total} keys
		Number of keys using sprintf: ${stats.sprintf.total} keys
		Number of keys using i18next components array (<number></number>): ${stats.i18nextComponentsArray.total} keys

		(explicit) null values: ${JSON.stringify(stats.nullValues.keys, null, 2)}
		==================================================
		__ : ${JSON.stringify(stats.__.keys, null, 2)}
		`;

const generateJSONContents = (files) =>
	files
		.map((file) => {
			// read the file contents

			const key = path.basename(file, '.i18n.json');
			const parsedJson = JSON.parse(fs.readFileSync(`./src/locales/${file}`, 'utf8'));
			return `\n"${key}":${JSON.stringify(normalizeI18nInterpolations(parsedJson, key), null, 2)}`;
		})
		.join(',');

const esm = `export default {
	${generateJSONContents(files)},
	normalizeI18nInterpolations: ${normalizeI18nInterpolations.toString()}}`;

const cjs = `module.exports = {
	${generateJSONContents(files)},
	normalizeI18nInterpolations: ${normalizeI18nInterpolations.toString()}}
`;

const keys = Object.keys(JSON.parse(fs.readFileSync(`./src/locales/en.i18n.json`, 'utf8')));

const tds = `export interface RocketchatI18n {
	${keys.map((key) => `${JSON.stringify(key)}: string;`).join('\n\t')}
}

export declare const dict: Record<string, RocketchatI18nKeys>;

export function normalizeI18nInterpolations(fileContents: Record<string, string>, language: string): Record<string, string>;

export type RocketchatI18nKeys = keyof RocketchatI18n;
`;

// write the files
fs.rmdirSync(`./dist`, { recursive: true });
fs.mkdirSync(`./dist`, { recursive: true });
fs.writeFileSync(`./dist/index.mjs`, esm);
fs.writeFileSync(`./dist/index.js`, cjs);
fs.writeFileSync(`./dist/index.d.ts`, tds);
fs.writeFileSync(`./dist/stats.txt`, interpolationReplacementsStats());
