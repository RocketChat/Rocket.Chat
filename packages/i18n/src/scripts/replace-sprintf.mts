import { argv, exit, stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { baseLanguage, getResourceLanguages, readResource, resourcesDirectory, writeResource } from './common.mts';

/**
 * Counts occurrences of a substring in a string
 */
const countOccurrences = (str: string, substring: string): number => {
	let count = 0;
	let position = str.indexOf(substring);

	while (position !== -1) {
		count++;
		position = str.indexOf(substring, position + 1);
	}

	return count;
};

/**
 * Main function to replace %s tokens with named parameters
 */
const replaceSprintfParams = async (translationKey: string): Promise<void> => {
	if (!translationKey) {
		throw new Error('Please provide a translation key as parameter');
	}

	const languages = await getResourceLanguages();

	if (languages.length === 0) {
		throw new Error(`No translation files found in ${resourcesDirectory}`);
	}

	console.log(`Found ${languages.length} translation files`);

	const baseResource = await readResource(baseLanguage);

	if (!baseResource[translationKey]) {
		throw new Error(`Translation key "${translationKey}" not found in ${baseLanguage} translations`);
	}

	if (typeof baseResource[translationKey] !== 'string') {
		throw new Error(`Translation key "${translationKey}" is not a string in ${baseLanguage} translations`);
	}

	const baseTranslation = baseResource[translationKey];
	const tokenCount = countOccurrences(baseTranslation, '%s');

	console.log(`Found translation key "${translationKey}" with value: "${baseTranslation}"`);
	console.log(`This string contains ${tokenCount} "%s" tokens`);

	if (tokenCount === 0) {
		console.log('No %s tokens found, nothing to do');
		return;
	}

	// Prompt for parameter names
	const rl = createInterface({ input, output });
	const promptMessage = `Please provide ${tokenCount} parameter names (comma-separated): `;
	const paramNamesInput = await rl.question(promptMessage);
	rl.close();

	// Split and trim parameter names
	const paramNames = paramNamesInput.split(',').map((name) => name.trim());

	if (paramNames.length !== tokenCount) {
		throw new Error(`Expected ${tokenCount} parameter names, but got ${paramNames.length}`);
	}

	// Process all translation files
	for await (const language of languages) {
		const resource = await readResource(language);

		if (resource[translationKey]) {
			const translation = resource[translationKey];

			if (typeof translation !== 'string') {
				console.warn(`Skipping "${translationKey}" in ${language} translations: not a string`);
				continue;
			}

			let updatedValue = translation;

			let paramIndex = 0;

			// Replace each %s token with a named parameter
			while (updatedValue.includes('%s') && paramIndex < paramNames.length) {
				updatedValue = updatedValue.replace('%s', `{{${paramNames[paramIndex]}}}`);
				paramIndex++;
			}

			resource[translationKey] = updatedValue;

			await writeResource(language, resource);
			console.log(`Updated "${translationKey}" in ${language} translations to: "${updatedValue}"`);
		}
	}

	console.log('All translation files have been updated');
};

if (import.meta.url.startsWith('file:')) {
	const modulePath = fileURLToPath(import.meta.url);

	if (argv[1] === modulePath) {
		const { positionals } = parseArgs({
			args: argv.slice(2),
			allowPositionals: true,
		});

		if (positionals.length === 0) {
			console.error('Please provide at least one translation key as parameter');
			exit(1);
		}

		for await (const arg of positionals) {
			await replaceSprintfParams(arg).catch((error) => {
				console.error(error);
				exit(1);
			});
		}
	}
}
