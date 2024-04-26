import fs from 'fs';
import path from 'path';

import { normalizeI18nInterpolations, pipe } from './normalize.mjs';

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
}`;

const cjs = `module.exports = {
	${contents}
}`;

const keys = Object.keys(JSON.parse(fs.readFileSync(`./src/locales/en.i18n.json`, 'utf8')));

const tds = `export interface RocketchatI18n {
	${keys.map((key) => `${JSON.stringify(key)}: string;`).join('\n\t')}
}

const dict: {
	[language: string]: RocketchatI18n;
};

export type RocketchatI18nKeys = keyof RocketchatI18n;

export = dict;
`;

const languages = files.map((file) => path.basename(file, '.i18n.json'));

// write the files
if (fs.existsSync(`./dist`)) {
	fs.rmdirSync(`./dist`, { recursive: true });
}
fs.mkdirSync(`./dist`, { recursive: true });

fs.writeFileSync(`./dist/languages.js`, `module.exports = ${JSON.stringify(languages, null, 2)}`);
fs.writeFileSync(`./dist/languages.mjs`, `export default ${JSON.stringify(languages, null, 2)}`);
fs.writeFileSync(
	`./dist/languages.d.ts`,
	`const languages: string[];
export default languages;`,
);

fs.writeFileSync(`./dist/index.mjs`, esm);
fs.writeFileSync(`./dist/index.js`, cjs);
fs.writeFileSync(`./dist/index.d.ts`, tds);
fs.writeFileSync(`./dist/stats.txt`, interpolationReplacementsStats());

// files.forEach((file) => {
// 	fs.writeFileSync(
// 		`./src/locales/${file}`,
// 		JSON.stringify(normalizeI18nInterpolations(JSON.parse(fs.readFileSync(`./src/locales/${file}`, 'utf8'))), null, 2),
// 	);
// });
