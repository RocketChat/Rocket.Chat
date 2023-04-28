import fs from 'fs';
import path from 'path';

// read all files in the current directory

const files = fs.readdirSync(`./src/locales`);

const esm = `export default {
	${files
		.map((file) => {
			// read the file contents

			const key = path.basename(file, '.i18n.json');
			return `"${key}":${fs.readFileSync(`./src/locales/${file}`, 'utf8')}`;
		})
		.join(',')}};`;

const cjs = `module.exports = {${files
	.map((file) => {
		// read the file contents

		const key = path.basename(file, '.i18n.json');
		return `"${key}":${fs.readFileSync(`./src/locales/${file}`, 'utf8')}`;
	})
	.join(',')}}
`;

const keys = Object.keys(JSON.parse(fs.readFileSync(`./src/locales/en.i18n.json`, 'utf8')));

const tds = `
export interface RocketchatI18n {
	${keys.map((key) => `${JSON.stringify(key)}: string;`).join('\n\t')}
}

export type RocketchatI18nKeys = keyof RocketchatI18n;
`;

// write the files
fs.rmdirSync(`./dist`, { recursive: true });
fs.mkdirSync(`./dist`, { recursive: true });
fs.writeFileSync(`./dist/index.mjs`, esm);
fs.writeFileSync(`./dist/index.js`, cjs);
fs.writeFileSync(`./dist/types.d.ts`, tds);
