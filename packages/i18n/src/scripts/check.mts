import { argv, exit, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatWithOptions, parseArgs, styleText } from 'node:util';

import { baseLanguage, getLanguagePlurals, getResourceLanguages, readContent, readResource, writeResource } from './common.mts';

type TaskOptions = {
	fix?: boolean;
};

let errorCount = 0;

const describeTask =
	(
		task: string,
		fn: () => AsyncGenerator<{
			lint: (reportError: (format?: any, ...param: any[]) => void) => Promise<void>;
			fix?: (throwError: (format?: any, ...param: any[]) => void) => Promise<void>;
		}>,
	) =>
	async (options: TaskOptions) => {
		const stdoutSupportsColor = styleText('blue', `.`, { stream: stdout }) !== '.';
		const stderrSupportsColor = styleText('blue', `.`, { stream: stderr }) !== '.';

		const throwError = (format?: any, ...param: any[]) => {
			throw new Error(formatWithOptions({ colors: stdoutSupportsColor }, format, ...param));
		};

		const reportError = (format?: any, ...param: any[]) => {
			console.error(
				styleText('red', '✘', { stream: stderr }),
				styleText('gray', `${task}:`, { stream: stderr }),
				formatWithOptions({ colors: stderrSupportsColor }, format, ...param),
			);
			errorCount++;
		};

		for await (const result of fn()) {
			if (!result) continue;

			if (options.fix) {
				try {
					if (!result.fix) {
						await result.lint(throwError);
						continue;
					}

					await result.fix(throwError);

					console.log(styleText('blue', '✔', { stream: stdout }), styleText('gray', `${task}:`, { stream: stdout }), 'fixes applied');
				} catch (error) {
					console.error(
						styleText('red', '✘', { stream: stdout }),
						styleText('gray', `${task}:`, { stream: stdout }),
						error instanceof Error ? error.message : error,
					);
					console.error(styleText('gray', `  cannot apply fixes automatically, run without --fix to see all errors`, { stream: stdout }));
					errorCount++;
				}
			} else {
				await result.lint(reportError);
			}
		}
	};

/**
 * Sort keys of the base language (en) alphabetically and write back the sorted resource file if necessary
 */
const sortBaseKeys = describeTask('sort-base-keys', async function* () {
	const baseResource = await readResource(baseLanguage);

	const keys = Object.keys(baseResource);
	const sortedKeys = keys.toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), 'en'));

	if (keys.join(',') === sortedKeys.join(',')) return;

	yield {
		lint: async (reportError) => {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const beforeKey = keys.at(i - 1);
				const j = sortedKeys.indexOf(key);
				const expectedBeforeKey = sortedKeys.at(j - 1);

				if (beforeKey !== expectedBeforeKey) {
					if (expectedBeforeKey) {
						reportError('%o should be after %o', keys[i], expectedBeforeKey);
					} else {
						reportError('%o should be the first key', keys[i]);
					}
				}
			}
		},
		fix: async () => {
			const sortedResource: Record<string, unknown> = {};
			for (const key of sortedKeys) {
				sortedResource[key] = baseResource[key];
			}

			await writeResource(baseLanguage, sortedResource);
		},
	};
});

/**
 * Apply the order of the base language (en) to all other languages
 */
const sortKeys = describeTask('sort-keys', async function* () {
	const baseResource = await readResource(baseLanguage);
	const baseKeys = new Set(Object.keys(baseResource));

	const languages = await getResourceLanguages();

	for await (const language of languages) {
		if (language === baseLanguage) continue;

		const resource = await readResource(language);
		const resourceKeys = new Set(Object.keys(resource));
		const extraKeys = resourceKeys.difference(baseKeys);

		const sortedResource: Record<string, unknown> = {};

		for (const key of baseKeys) {
			if (!resourceKeys.has(key)) continue;
			sortedResource[key] = resource[key];
		}

		for (const key of extraKeys) {
			sortedResource[key] = resource[key];
		}

		if (Object.keys(resource).join(',') === Object.keys(sortedResource).join(',')) continue;

		yield {
			lint: async (reportError) => {
				const keys = Object.keys(resource);
				const sortedKeys = Object.keys(sortedResource);

				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (extraKeys.has(key)) continue;

					const j = sortedKeys.indexOf(key);
					const expectedBeforeKey = sortedKeys.at(j - 1);
					const beforeKey = keys.at(i - 1);

					if (beforeKey !== expectedBeforeKey) {
						if (expectedBeforeKey) {
							reportError('%s: %o should be after %o', language, keys[i], expectedBeforeKey);
						} else {
							reportError('%s: %o should be the first key', language, keys[i]);
						}
					}
				}
			},
			fix: async () => {
				await writeResource(language, sortedResource);
			},
		};
	}
});

/**
 * Wipes extra keys from all language files that are not present in the base language (en)
 */
const wipeExtraKeys = describeTask('wipe-extra-keys', async function* () {
	const baseResource = await readResource(baseLanguage);
	const baseKeys = new Set(Object.keys(baseResource));

	const languages = await getResourceLanguages();

	for await (const language of languages) {
		if (language === baseLanguage) continue;

		const resource = await readResource(language);
		const resourceKeys = new Set(Object.keys(resource));

		if (resourceKeys.difference(baseKeys).size === 0) continue;

		yield {
			lint: async (reportError) => {
				const extraKeys = resourceKeys.difference(baseKeys);
				for (const key of extraKeys) {
					reportError('%s: has extra key %o', language, key);
				}
			},
			fix: async () => {
				const wipedResource: Record<string, unknown> = {};
				// Traversing the own resource keys to preserve the original order
				for (const key of Object.keys(resource)) {
					if (!baseKeys.has(key)) continue;
					wipedResource[key] = resource[key];
				}

				await writeResource(language, wipedResource);
			},
		};
	}
});

/**
 * Wipes invalid plural forms from all language files (only "zero", "one", "two", "few", "many", "other" are valid)
 */
const wipeInvalidPlurals = describeTask('wipe-invalid-plurals', async function* () {
	const languages = await getResourceLanguages();

	for await (const language of languages) {
		const resource = await readResource(language);
		const plurals = getLanguagePlurals(language).concat(['zero']); // 'zero' is special in i18next

		for (const [key, translation] of Object.entries(resource)) {
			if (typeof translation !== 'object' || !translation) continue;

			const translationPlurals = Object.keys(translation);
			for (const plural of translationPlurals) {
				if (!plurals.includes(plural)) {
					yield {
						lint: async (reportError) => {
							reportError('%s: key %o has invalid plural form %o', language, key, plural);
						},
						fix: async () => {
							const fixedResource: Record<string, unknown> = { ...resource };
							fixedResource[key] = Object.fromEntries(Object.entries(translation).filter(([p]) => plurals.includes(p)));
							await writeResource(language, fixedResource);
						},
					};
				}
			}
		}
	}
});

/**
 * Finds missing plural forms in all language files
 */
const findMissingPlurals = describeTask('find-missing-plurals', async function* () {
	const languages = await getResourceLanguages();

	for await (const language of languages) {
		if (language === baseLanguage) continue;

		const resource = await readResource(language);
		const baseResource = await readResource(baseLanguage);
		const plurals = getLanguagePlurals(language);

		for (const [key, translation] of Object.entries(baseResource)) {
			if (typeof translation !== 'object' || !translation) continue;
			if (!(key in resource)) continue;

			const translationPlurals = Object.keys(translation);
			const resourceTranslation = resource[key];
			if (typeof resourceTranslation !== 'object' || !resourceTranslation) continue;

			for (const plural of translationPlurals) {
				if (!plurals.includes(plural)) continue;
				if (plural in resourceTranslation) continue;
				yield {
					lint: async (reportError) => {
						reportError('%s: key %o is missing plural form %o', language, key, plural);
					},
				};
			}
		}
	}
});

function* listTranslations(resource: Record<string, unknown>) {
	for (const [key, translation] of Object.entries(resource)) {
		if (typeof translation === 'string') {
			yield { key, translation } as const;
			continue;
		}

		if (typeof translation === 'object' && translation) {
			for (const [plural, pluralTranslation] of Object.entries(translation)) {
				if (typeof pluralTranslation !== 'string') continue;
				yield { key, plural, translation: pluralTranslation } as const;
			}
		}
	}
}

const replaceDoubleUnderscorePlaceholders = describeTask('replace-2-underscores', async function* () {
	const languages = await getResourceLanguages();

	const placeholderRegex = /__(.*?)__/g;
	const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

	for await (const language of languages) {
		const resource = await readResource(language);

		for (const { key, plural, translation } of listTranslations(resource)) {
			const matches = Array.from(translation.matchAll(placeholderRegex));
			if (!matches.length) continue;

			for (const match of matches) {
				if (!identifierRegex.test(match[1])) {
					yield {
						lint: async (reportError) => {
							if (plural) {
								reportError('%s: key %o (plural %o) has invalid placeholder %o', language, key, plural, match[0]);
							} else {
								reportError('%s: key %o has invalid placeholder %o', language, key, match[0]);
							}
						},
					};
					continue;
				}

				yield {
					lint: async (reportError) => {
						if (plural) {
							reportError('%s: key %o (plural %o) has placeholder %o, should be %o', language, key, plural, match[0], `{{${match[1]}}}`);
						} else {
							reportError('%s: key %o has placeholder %o, should be %o', language, key, match[0], `{{${match[1]}}}`);
						}
					},
					fix: async () => {
						const fixedResource = { ...resource };
						if (plural) {
							fixedResource[key] = {
								...(fixedResource[key] as Record<string, string>),
								[plural]: translation.replace(placeholderRegex, `{{${match[1]}}}`),
							};
						} else {
							fixedResource[key] = translation.replace(placeholderRegex, `{{${match[1]}}}`);
						}
						await writeResource(language, fixedResource);
					},
				};
			}
		}
	}
});

const trimEndOfFile = describeTask('trim-eof', async function* () {
	const languages = await getResourceLanguages();

	for await (const language of languages) {
		const content = await readContent(language);
		const trimmedContent = content.replace(/\s+$/g, '');

		if (trimmedContent.length === content.length) continue;

		yield {
			lint: async (reportError) => {
				reportError('%s: has trailing whitespace at end of file', language);
			},
			fix: async () => {
				await writeResource(language, JSON.parse(trimmedContent));
			},
		};
	}
});

const extractPlaceholders = (translation: string): Set<string> => {
	const placeholders = new Set<string>();
	const placeholderRegex = /{{(.+?)(,.*?)?}}/g;
	let match;
	while ((match = placeholderRegex.exec(translation)) !== null) {
		placeholders.add(match[1]);
	}
	return placeholders;
};

const encodedKey = (key: string, plural?: string) => (plural ? `${key}|${plural}` : key);

/**
 * Finds translations that are missing placeholders present in the base language (en)
 */
const missingPlaceholders = describeTask('missing-placeholders', async function* () {
	const baseResource = await readResource(baseLanguage);
	const baseTranslations = listTranslations(baseResource);
	const basePlaceholdersByEncodedKey = new Map<string, Set<string>>();

	for (const { key: baseKey, plural: basePlural, translation: baseTranslation } of baseTranslations) {
		basePlaceholdersByEncodedKey.set(encodedKey(baseKey, basePlural), extractPlaceholders(baseTranslation));
	}

	const languages = await getResourceLanguages();

	for await (const language of languages) {
		if (language === baseLanguage) continue;

		const resource = await readResource(language);
		const translations = listTranslations(resource);

		for (const { key, plural, translation } of translations) {
			const basePlaceholders = basePlaceholdersByEncodedKey.get(encodedKey(key, plural));
			if (!basePlaceholders) continue;

			const placeholders = extractPlaceholders(translation);

			for (const basePlaceholder of basePlaceholders) {
				if (placeholders.has(basePlaceholder)) continue;

				yield {
					lint: async (reportError) => {
						if (plural) {
							reportError('%s: key %o (plural %o) is missing placeholder %o', language, key, plural, basePlaceholder);
							return;
						}
						reportError('%s: key %o is missing placeholder %o', language, key, basePlaceholder);
					},
				};
			}
		}
	}
});

/**
 * Finds translations that have extra placeholders not present in the base language (en)
 */
const extraPlaceholders = describeTask('extra-placeholders', async function* () {
	const baseResource = await readResource(baseLanguage);
	const baseTranslations = listTranslations(baseResource);
	const basePlaceholdersByEncodedKey = new Map<string, Set<string>>();

	for (const { key: baseKey, plural: basePlural, translation: baseTranslation } of baseTranslations) {
		basePlaceholdersByEncodedKey.set(encodedKey(baseKey, basePlural), extractPlaceholders(baseTranslation));
	}

	const languages = await getResourceLanguages();

	for await (const language of languages) {
		if (language === baseLanguage) continue;

		const resource = await readResource(language);
		const translations = listTranslations(resource);

		for (const { key, plural, translation } of translations) {
			const basePlaceholders = basePlaceholdersByEncodedKey.get(encodedKey(key, plural));
			if (!basePlaceholders) continue;

			const placeholders = extractPlaceholders(translation);

			for (const placeholder of placeholders) {
				if (basePlaceholders.has(placeholder)) continue;

				yield {
					lint: async (reportError) => {
						reportError('%s: key %o%s has extra placeholder %o', language, key, plural ? ` (plural ${plural})` : '', placeholder);
					},
				};
			}
		}
	}
});

const findPositionalParams = describeTask('find-sprintf-params', async function* () {
	const sprintfRegex = /%s/g;

	const resource = await readResource(baseLanguage);

	for (const { key, plural, translation } of listTranslations(resource)) {
		const match = sprintfRegex.exec(translation);
		if (!match) continue;

		yield {
			lint: async (reportError) => {
				if (plural) {
					reportError(
						'key %o (plural %o) has positional parameter %o, should be named parameter like %o',
						key,
						plural,
						match[0],
						'{{param}}',
					);
				} else {
					reportError('key %o has positional parameter %o, should be named parameter like %o', key, match[0], '{{param}}');
				}
			},
		};
	}
});

/**
 * Map of all available tasks
 */
const tasksByName = {
	'sort-base-keys': sortBaseKeys,
	'sort-keys': sortKeys,
	'wipe-extra-keys': wipeExtraKeys,
	'wipe-invalid-plurals': wipeInvalidPlurals,
	'find-missing-plurals': findMissingPlurals,
	'replace-2-underscores': replaceDoubleUnderscorePlaceholders,
	'trim-eof': trimEndOfFile,
	'find-sprintf-params': findPositionalParams,
	'missing-placeholders': missingPlaceholders,
	'extra-placeholders': extraPlaceholders,
} as const;

async function check({ fix, task }: { fix?: boolean; task?: string[] } = {}) {
	// We're lenient by default excluding some non-critical tasks
	const tasks = new Set<keyof typeof tasksByName>([
		'sort-keys',
		'wipe-extra-keys',
		'wipe-invalid-plurals',
		'find-missing-plurals',
		'replace-2-underscores',
		'trim-eof',
		'missing-placeholders',
		'extra-placeholders',
	]);

	if (task?.length) {
		tasks.clear();
		task.filter((taskName): taskName is keyof typeof tasksByName => taskName in tasksByName).forEach((taskName) => tasks.add(taskName));
	}

	if (tasks.size === 0) {
		throw new Error('No valid tasks selected.');
	}

	for await (const taskName of tasks) {
		const task = tasksByName[taskName];
		await task({ fix });
	}

	if (errorCount > 0) {
		throw new Error(`${errorCount} error(s) found.`);
	}
}

if (import.meta.url.startsWith('file:')) {
	const modulePath = fileURLToPath(import.meta.url);

	if (argv[1] === modulePath) {
		const { values } = parseArgs({
			args: argv.slice(2),
			options: {
				fix: { type: 'boolean', short: 'f' },
				task: {
					type: 'string',
					multiple: true,
					short: 't',
					choices: Object.keys(tasksByName),
				},
			},
		});

		check(values).catch((error) => {
			console.error(error);
			exit(1);
		});
	}
}
