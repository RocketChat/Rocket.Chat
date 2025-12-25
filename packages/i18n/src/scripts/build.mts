import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

import { distDirectory, languageFromBasename, resourceBasename, resourcesDirectory } from './common.mts';
import { normalizeI18nInterpolations } from './normalize.mts';

async function build() {
	// read all files in the src/locales directory
	const resourceFiles = await readdir(resourcesDirectory);
	const resources = await Promise.all(
		resourceFiles.map(async (file) => ({
			language: languageFromBasename(file),
			content: JSON.parse(await readFile(join(resourcesDirectory, file), 'utf8')),
		})),
	);

	// normalize the interpolations and collect the stats
	const countsByNormalization: Record<string, number> = {
		__: 0,
		sprintf: 0,
		i18nextComponentsArray: 0,
		nullValues: 0,
		nestedPlurals: 0,
	};

	// Uncomment these lines for verbose output
	// const languageLength = resources.reduce((max, resource) => Math.max(max, resource.language.length), 0);
	// const statKeyLength = Object.keys(countsByNormalization).reduce((max, key) => Math.max(max, key.length), 0);
	for (const resource of resources) {
		resource.content = normalizeI18nInterpolations(resource.content, resource.language, (statName: string) => {
			countsByNormalization[statName]++;
			// console.log(`${statName.padEnd(statKeyLength)} ${resource.language.padStart(languageLength)} ${JSON.stringify(record.key)}`);
		});
	}

	console.log();
	console.log(`Number of keys using __ and replaced by native i18next interpolation('{{' '}}') key: ${countsByNormalization.__} keys`);
	console.log(`Number of keys with (explicit) null values: ${countsByNormalization.nullValues} keys`);
	console.log(`Number of keys using sprintf: ${countsByNormalization.sprintf} keys`);
	console.log(`Number of keys using i18next components array (<number></number>): ${countsByNormalization.i18nextComponentsArray} keys`);
	console.log(`Number of keys with nested plurals: ${countsByNormalization.nestedPlurals} keys`);

	await mkdir(distDirectory, { recursive: true });

	// write the files

	// ./resources/*.i18n.json
	await mkdir(join(distDirectory, 'resources'), { recursive: true });
	for await (const resource of resources) {
		await writeFile(join(distDirectory, 'resources', resourceBasename(resource.language)), JSON.stringify(resource.content, null, 2));
	}

	// ./resources
	const baseResource = resources.find((r) => r.language === 'en');
	if (!baseResource) {
		throw new Error('Base resource "en" not found');
	}

	await writeFile(
		join(distDirectory, 'resources.d.ts'),
		`export interface RocketchatI18n {
	${Object.keys(baseResource.content)
		.map((key) => `${JSON.stringify(key)}: string;`)
		.join('\n\t')}
}
export type RocketchatI18nKeys = keyof RocketchatI18n;
declare const resources: Record<string, RocketchatI18n>;
export default resources;`,
	);

	// ./languages
	const languages = resources.map(({ language }) => language);
	const languagesSerialized = JSON.stringify(languages, null, 2);

	await writeFile(join(distDirectory, 'languages.js'), `export default ${languagesSerialized};`);

	await writeFile(
		join(distDirectory, 'languages.cjs'),
		`"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${languagesSerialized};`,
	);

	await writeFile(
		join(distDirectory, 'languages.d.ts'),
		`declare const languages: string[];
export default languages;`,
	);
}

if (import.meta.url.startsWith('file:')) {
	const modulePath = fileURLToPath(import.meta.url);

	if (argv[1] === modulePath) {
		build().catch((error) => {
			console.error(error);
			exit(1);
		});
	}
}
