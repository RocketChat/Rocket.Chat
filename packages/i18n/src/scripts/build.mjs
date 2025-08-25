import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeI18nInterpolations } from './normalize.mjs';

export async function build() {
	const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
	const resourcesDirectory = join(rootDirectory, 'src', 'locales');
	const distDirectory = join(rootDirectory, 'dist');

	// read all files in the src/locales directory
	const resourceFiles = await readdir(resourcesDirectory);
	const resources = await Promise.all(
		resourceFiles.map(async (file) => ({
			language: basename(file, '.i18n.json'),
			content: JSON.parse(await readFile(join(resourcesDirectory, file), 'utf8')),
		})),
	);

	// normalize the interpolations and collect the stats
	const countsByNormalization = {
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
		resource.content = normalizeI18nInterpolations(resource.content, resource.language, (statName) => {
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

	// purge dist directory
	await rm(distDirectory, { recursive: true, force: true });
	await mkdir(distDirectory, { recursive: true });

	// write the files

	// ./resources/*.i18n.json
	await mkdir(join(distDirectory, 'resources'), { recursive: true });
	for await (const resource of resources) {
		await writeFile(join(distDirectory, 'resources', `${resource.language}.i18n.json`), JSON.stringify(resource.content, null, 2));
	}

	// ./resources
	const allResources = resources.reduce((acc, resource) => {
		return {
			...acc,
			[resource.language]: resource.content,
		};
	}, {});
	const allResourcesSerialized = JSON.stringify(allResources, null, 2);

	await writeFile(join(distDirectory, 'resources.mjs'), `export default ${allResourcesSerialized};`);

	await writeFile(
		join(distDirectory, 'resources.js'),
		`"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${allResourcesSerialized};`,
	);

	await writeFile(
		join(distDirectory, 'resources.d.ts'),
		`export interface RocketchatI18n {
	${Object.keys(allResources.en)
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

	await writeFile(join(distDirectory, 'languages.mjs'), `export default ${languagesSerialized};`);

	await writeFile(
		join(distDirectory, 'languages.js'),
		`"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${languagesSerialized};`,
	);

	await writeFile(
		join(distDirectory, 'languages.d.ts'),
		`declare const languages: string[];
export default languages;`,
	);

	// ./index
	await writeFile(join(distDirectory, 'index.mjs'), `export * from './esm/index.js';`);

	await writeFile(
		join(distDirectory, 'index.js'),
		`"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		if (k2 === undefined) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
			desc = { enumerable: true, get: function() { return m[k]; } };
		}
		Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
		if (k2 === undefined) k2 = k;
		o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
		return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./cjs/index"), exports);`,
	);

	await writeFile(join(distDirectory, 'index.d.ts'), `export * from './esm/index';`);
}

if (import.meta.url.startsWith('file:')) {
	const modulePath = fileURLToPath(import.meta.url);
	if (process.argv[1] === modulePath) {
		build();
	}
}
