import { argv, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatWithOptions, parseArgs, styleText } from 'node:util';

import { baseLanguage, getResourceLanguages, readResource, writeResource } from './common.mts';

type TaskOptions = {
	fix?: boolean;
};

let errorCount = 0;

const describeTask =
	(
		task: string,
		fn: () => AsyncGenerator<{
			lint: (collectError: (format?: any, ...param: any[]) => void) => Promise<void>;
			fix: () => Promise<void>;
		}>,
	) =>
	async (options: TaskOptions) => {
		for await (const result of fn()) {
			if (!result) continue;

			if (options.fix) {
				await result.fix();
				console.log(styleText('blue', '✔', { stream: stdout }), styleText('gray', `${task}:`, { stream: stdout }), 'fixes applied');
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
 * Sort keys of the base language (en) alphabetically
 * and write back the sorted resource file if necessary
 */
const sortBaseKeys = describeTask('sort-base-keys', async function* () {
	const baseResource = await readResource(baseLanguage);

	const keys = Object.keys(baseResource);
	const sortedKeys = keys.toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), 'en'));

	if (keys.join(',') === sortedKeys.join(',')) return;

	yield {
		lint: async (collectError) => {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const beforeKey = keys.at(i - 1);
				const j = sortedKeys.indexOf(key);
				const expectedBeforeKey = sortedKeys.at(j - 1);

				if (beforeKey !== expectedBeforeKey) {
					if (expectedBeforeKey) {
						collectError('%o should be after %o', keys[i], expectedBeforeKey);
					} else {
						collectError('%o should be the first key', keys[i]);
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
			lint: async (collectError) => {
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
							collectError('%s: %o should be after %o', language, keys[i], expectedBeforeKey);
						} else {
							collectError('%s: %o should be the first key', language, keys[i]);
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
			lint: async (collectError) => {
				const extraKeys = resourceKeys.difference(baseKeys);
				for (const key of extraKeys) {
					collectError('%s: has extra key %o', language, key);
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

const tasksByName = {
	'sort-base-keys': sortBaseKeys,
	'sort-keys': sortKeys,
	'wipe-extra-keys': wipeExtraKeys,
} as const;

async function check({ fix, task }: { fix?: boolean; task?: string[] } = {}) {
	// We're lenient by default excluding 'sort-base-keys' from the default tasks
	const tasks = new Set<keyof typeof tasksByName>(['sort-keys', 'wipe-extra-keys']);

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
