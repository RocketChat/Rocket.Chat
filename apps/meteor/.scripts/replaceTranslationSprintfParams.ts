import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

import fg from 'fast-glob';

const LOCALES_DIR = join(process.cwd(), '..', '..', 'packages', 'i18n', 'src', 'locales');

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
 * Parse a JSON file and return its content
 */
const parseFile = async (path: string): Promise<Record<string, string>> => {
	const content = await readFile(path, 'utf-8');
	try {
		return JSON.parse(content);
	} catch (e) {
		console.error(`Error parsing JSON file at ${path}: ${(e as Error).message}`);
		process.exit(1);
	}
};

/**
 * Save a JSON file with proper formatting
 */
const saveFile = async (path: string, json: Record<string, string>): Promise<void> => {
	try {
		await writeFile(path, JSON.stringify(json, null, 2), 'utf-8');
		console.log(`Updated ${path}`);
	} catch (e) {
		console.error(`Error saving file at ${path}: ${(e as Error).message}`);
	}
};

/**
 * Main function to replace %s tokens with named parameters
 */
const replaceTranslationSprintfParams = async (): Promise<void> => {
	// Check if a translation key was provided
	const translationKey = process.argv[2];

	if (!translationKey) {
		console.error('Please provide a translation key as parameter');
		process.exit(1);
	}

	// Find all translation files
	const translationFiles = await fg('*.i18n.json', { cwd: LOCALES_DIR, absolute: true });

	if (translationFiles.length === 0) {
		console.error(`No translation files found in ${LOCALES_DIR}`);
		process.exit(1);
	}

	console.log(`Found ${translationFiles.length} translation files`);

	// Find the key in the English file first to count the %s tokens
	const enFilePath = translationFiles.find((file) => file.endsWith('en.i18n.json'));

	if (!enFilePath) {
		console.error('English translation file not found');
		process.exit(1);
	}

	const enTranslations = await parseFile(enFilePath);

	if (!enTranslations[translationKey]) {
		console.error(`Translation key "${translationKey}" not found in English translations`);
		process.exit(1);
	}

	const englishValue = enTranslations[translationKey];
	const tokenCount = countOccurrences(englishValue, '%s');

	console.log(`Found translation key "${translationKey}" with value: "${englishValue}"`);
	console.log(`This string contains ${tokenCount} "%s" tokens`);

	if (tokenCount === 0) {
		console.log('No %s tokens found, nothing to do');
		process.exit(0);
	}

	// Prompt for parameter names
	const rl = createInterface({ input, output });
	const promptMessage = `Please provide ${tokenCount} parameter names (comma-separated): `;
	const paramNamesInput = await rl.question(promptMessage);
	rl.close();

	// Split and trim parameter names
	const paramNames = paramNamesInput.split(',').map((name) => name.trim());

	if (paramNames.length !== tokenCount) {
		console.error(`Expected ${tokenCount} parameter names, but got ${paramNames.length}`);
		process.exit(1);
	}

	// Process all translation files
	for (const filePath of translationFiles) {
		// eslint-disable-next-line no-await-in-loop
		const translations = await parseFile(filePath);

		if (translations[translationKey]) {
			let updatedValue = translations[translationKey];
			let paramIndex = 0;

			// Replace each %s token with a named parameter
			while (updatedValue.includes('%s') && paramIndex < paramNames.length) {
				updatedValue = updatedValue.replace('%s', `{{${paramNames[paramIndex]}}}`);
				paramIndex++;
			}

			translations[translationKey] = updatedValue;
			// eslint-disable-next-line no-await-in-loop
			await saveFile(filePath, translations);
		}
	}

	console.log('All translation files have been updated');
};

// Run the script
replaceTranslationSprintfParams().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
