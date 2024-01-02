import type { PathLike } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inspect } from 'node:util';

import fg from 'fast-glob';
import i18next from 'i18next';
import supportsColor from 'supports-color';

const hasDuplicatedKeys = (content: string, json: Record<string, string>) => {
	const matchKeys = content.matchAll(/^\s+"([^"]+)"/gm);

	const allKeys = [...matchKeys];

	return allKeys.length !== Object.keys(json).length;
};

const parseFile = async (path: PathLike) => {
	const content = await readFile(path, 'utf-8');
	let json: Record<string, string>;
	try {
		json = JSON.parse(content);
	} catch (e) {
		if (e instanceof SyntaxError) {
			const matches = /^Unexpected token .* in JSON at position (\d+)$/.exec(e.message);

			if (matches) {
				const [, positionStr] = matches;
				const position = parseInt(positionStr, 10);
				const line = content.slice(0, position).split('\n').length;
				const column = position - content.slice(0, position).lastIndexOf('\n');
				throw new SyntaxError(`Invalid JSON on file ${path}:${line}:${column}`);
			}
		}
		throw new SyntaxError(`Invalid JSON on file ${path}: ${e.message}`);
	}

	if (hasDuplicatedKeys(content, json)) {
		throw new SyntaxError(`Duplicated keys found on file ${path}`);
	}

	return json;
};

const insertTranslation = (json: Record<string, string>, refKey: string, [key, value]: [key: string, value: string]) => {
	const entries = Object.entries(json);

	const refIndex = entries.findIndex(([entryKey]) => entryKey === refKey);

	if (refIndex === -1) {
		throw new Error(`Reference key ${refKey} not found`);
	}

	const movingEntries = entries.slice(refIndex + 1);

	for (const [key] of movingEntries) {
		delete json[key];
	}

	json[key] = value;

	for (const [key, value] of movingEntries) {
		json[key] = value;
	}
};

const persistFile = async (path: PathLike, json: Record<string, string>) => {
	const content = JSON.stringify(json, null, 2);

	await writeFile(path, content, 'utf-8');
};

const oldPlaceholderFormat = /__([a-zA-Z_]+)__/g;

const checkPlaceholdersFormat = async ({ json, path, fix = false }: { json: Record<string, string>; path: PathLike; fix?: boolean }) => {
	const outdatedKeys = Object.entries(json)
		.map(([key, value]) => ({
			key,
			value,
			placeholders: value.match(oldPlaceholderFormat),
		}))
		.filter((outdatedKey): outdatedKey is { key: string; value: string; placeholders: RegExpMatchArray } => !!outdatedKey.placeholders);

	if (outdatedKeys.length > 0) {
		const message = `Outdated placeholder format on file ${path}: ${inspect(outdatedKeys, { colors: !!supportsColor.stdout })}`;

		if (fix) {
			console.warn(message);

			for (const { key, value } of outdatedKeys) {
				const newValue = value.replace(oldPlaceholderFormat, (_, name) => `{{${name}}}`);

				json[key] = newValue;
			}

			await persistFile(path, json);

			return;
		}

		throw new Error(message);
	}
};

export const extractSingularKeys = (json: Record<string, string>, lng: string) => {
	if (!i18next.isInitialized) {
		i18next.init({ initImmediate: false });
	}

	const pluralSuffixes = i18next.services.pluralResolver.getSuffixes(lng) as string[];

	const singularKeys = new Set(
		Object.keys(json).map((key) => {
			for (const pluralSuffix of pluralSuffixes) {
				if (key.endsWith(pluralSuffix)) {
					return key.slice(0, -pluralSuffix.length);
				}
			}

			return key;
		}),
	);

	return [singularKeys, pluralSuffixes] as const;
};

const checkMissingPlurals = async ({
	json,
	path,
	lng,
	fix = false,
}: {
	json: Record<string, string>;
	path: PathLike;
	lng: string;
	fix?: boolean;
}) => {
	const [singularKeys, pluralSuffixes] = extractSingularKeys(json, lng);

	const missingPluralKeys: { singularKey: string; existing: string[]; missing: string[] }[] = [];

	for (const singularKey of singularKeys) {
		if (singularKey in json) {
			continue;
		}

		const pluralKeys = pluralSuffixes.map((suffix) => `${singularKey}${suffix}`);

		const existing = pluralKeys.filter((key) => key in json);
		const missing = pluralKeys.filter((key) => !(key in json));

		if (missing.length > 0) {
			missingPluralKeys.push({ singularKey, existing, missing });
		}
	}

	if (missingPluralKeys.length > 0) {
		const message = `Missing plural keys on file ${path}: ${inspect(missingPluralKeys, { colors: !!supportsColor.stdout })}`;

		if (fix) {
			console.warn(message);

			for (const { existing, missing } of missingPluralKeys) {
				for (const missingKey of missing) {
					const refKey = existing.slice(-1)[0];
					const value = json[refKey];
					insertTranslation(json, refKey, [missingKey, value]);
				}
			}

			await persistFile(path, json);

			return;
		}

		throw new Error(message);
	}
};

const checkExceedingKeys = async ({
	json,
	path,
	lng,
	sourceJson,
	sourceLng,
	fix = false,
}: {
	json: Record<string, string>;
	path: PathLike;
	lng: string;
	sourceJson: Record<string, string>;
	sourceLng: string;
	fix?: boolean;
}) => {
	const [singularKeys] = extractSingularKeys(json, lng);
	const [sourceSingularKeys] = extractSingularKeys(sourceJson, sourceLng);

	const exceedingKeys = [...singularKeys].filter((key) => !sourceSingularKeys.has(key));

	if (exceedingKeys.length > 0) {
		const message = `Exceeding keys on file ${path}: ${inspect(exceedingKeys, { colors: !!supportsColor.stdout })}`;

		if (fix) {
			for (const key of exceedingKeys) {
				delete json[key];
			}

			await persistFile(path, json);

			return;
		}

		throw new Error(message);
	}
};

const checkFiles = async (sourceDirPath: string, sourceLng: string, fix = false) => {
	const sourcePath = join(sourceDirPath, `${sourceLng}.i18n.json`);
	const sourceJson = await parseFile(sourcePath);

	await checkPlaceholdersFormat({ json: sourceJson, path: sourcePath, fix });
	await checkMissingPlurals({ json: sourceJson, path: sourcePath, lng: sourceLng, fix });

	const i18nFiles = await fg([join(sourceDirPath, `**/*.i18n.json`), `!${sourcePath}`]);

	const languageFileRegex = /\/([^\/]*?).i18n.json$/;
	const translations = await Promise.all(
		i18nFiles.map(async (path) => {
			const lng = languageFileRegex.exec(path)?.[1];
			if (!lng) {
				throw new Error(`Invalid language file path ${path}`);
			}

			return { path, json: await parseFile(path), lng };
		}),
	);

	for await (const { path, json, lng } of translations) {
		await checkPlaceholdersFormat({ json, path, fix });
		await checkMissingPlurals({ json, path, lng, fix });
		await checkExceedingKeys({ json, path, lng, sourceJson, sourceLng, fix });
	}
};

const fix = process.argv[2] === '--fix';
checkFiles('./packages/rocketchat-i18n/i18n', 'en', fix).catch((e) => {
	console.error(e);
	process.exit(1);
});
