import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import i18next from 'i18next';

export const baseLanguage = 'en';

export async function getResourceLanguages() {
	const resourceFiles = await readdir(resourcesDirectory);
	return resourceFiles.map((file) => languageFromBasename(file));
}

export const getLanguagePlurals = (language: string): string[] => {
	// @ts-expect-error - faulty module resolution from ESM package
	if (!i18next.isInitialized) {
		i18next.init({ initImmediate: false });
	}

	// @ts-expect-error - faulty module resolution from ESM package
	return i18next.services.pluralResolver.getSuffixes(language).map((suffix: string) => suffix.slice(1));
};

export async function readContent(language: string) {
	return readFile(join(resourcesDirectory, resourceBasename(language)), 'utf8');
}

export async function readResource(language: string): Promise<Record<string, unknown>> {
	const result = JSON.parse(await readContent(language));
	if (typeof result !== 'object' || result === null || Array.isArray(result)) {
		throw new Error(`Invalid resource format for language "${language}"`);
	}
	return result;
}

export async function writeResource(language: string, resource: unknown) {
	const content = JSON.stringify(resource, null, 2);
	return writeFile(join(resourcesDirectory, resourceBasename(language)), content, 'utf8');
}

export const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const resourcesDirectory = join(rootDirectory, 'src', 'locales');
export const distDirectory = join(rootDirectory, 'dist');

export const resourceBasename = (language: string) => `${language}.i18n.json`;
export const languageFromBasename = (path: string) => basename(path, '.i18n.json');
