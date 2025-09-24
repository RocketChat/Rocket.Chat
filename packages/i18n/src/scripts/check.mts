import { argv, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatWithOptions, parseArgs, styleText } from 'node:util';

import { baseLanguage, getLanguagePlurals, getResourceLanguages, readResource, writeResource } from './common.mts';

type TaskOptions = {
	fix?: boolean;
};

let errorCount = 0;

const describeTask =
	(
		task: string,
		fn: () => AsyncGenerator<{
			lint: (reportError: (format?: any, ...param: any[]) => void) => Promise<void>;
			fix: (throwError: (format?: any, ...param: any[]) => void) => Promise<void>;
		}>,
	) =>
	async (options: TaskOptions) => {
		for await (const result of fn()) {
			if (!result) continue;

			if (options.fix) {
				try {
					await result.fix((format, ...param) => {
						throw new Error(formatWithOptions({ colors: !!styleText('blue', `.`, { stream: stdout }) }, format, ...param));
					});

					console.log(styleText('blue', '✔', { stream: stdout }), styleText('gray', `${task}:`, { stream: stdout }), 'fixes applied');
				} catch (error) {
					console.error(styleText('red', '✘', { stream: stdout }), styleText('gray', `${task}:`, { stream: stdout }), error instanceof Error ? error.message : error);
					console.error(styleText('gray', `  cannot apply fixes automatically, run without --fix to see all errors`, { stream: stdout }));
					errorCount++;
				}
			} else {
				const stderrSupportsColor = styleText('blue', `.`, { stream: stderr }) !== '.';

				await result.lint((_format, ...param) => {
					console.error(
						styleText('red', '✘', { stream: stderr }),
						styleText('gray', `${task}:`, { stream: stderr }),
						formatWithOptions({ colors: stderrSupportsColor }, _format, ...param),
					);
					errorCount++;
				});
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
							fixedResource[key] = Object.fromEntries(
								Object.entries(translation).filter(([p]) => plurals.includes(p)),
							);
							await writeResource(language, fixedResource);
						}
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
					fix: async (throwError) => {
						throwError('%s: key %o is missing plural form %o', language, key, plural);
					}
				};
			}
		}
	}
});

const tasksByName = {
	'sort-base-keys': sortBaseKeys,
	'sort-keys': sortKeys,
	'wipe-extra-keys': wipeExtraKeys,
	'wipe-invalid-plurals': wipeInvalidPlurals,
	'find-missing-plurals': findMissingPlurals,
} as const;

async function check({ fix, task }: { fix?: boolean; task?: string[] } = {}) {
	// We're lenient by default excluding 'sort-base-keys' from the default tasks
	const tasks = new Set<keyof typeof tasksByName>(['sort-keys', 'wipe-extra-keys', 'wipe-invalid-plurals', 'find-missing-plurals']);

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
			process.exit(1);
		});
	}
}
