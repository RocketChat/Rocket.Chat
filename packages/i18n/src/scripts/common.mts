import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const baseLanguage = 'en';

export async function getResourceLanguages() {
	const resourceFiles = await readdir(resourcesDirectory);
	return resourceFiles.map((file) => languageFromBasename(file));
}

export async function readResource(language: string) {
	return JSON.parse(await readFile(join(resourcesDirectory, resourceBasename(language)), 'utf8'));
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
