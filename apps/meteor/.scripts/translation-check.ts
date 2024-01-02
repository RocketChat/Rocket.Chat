import type { PathLike } from 'node:fs';
import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inspect } from 'node:util';

import fg from 'fast-glob';
import i18next from 'i18next';
import supportsColor from 'supports-color';

const validateKeys = (json: Record<string, string>, usedKeys: { key: string; replaces: string[] }[]) =>
	usedKeys
		.filter(({ key }) => typeof json[key] !== 'undefined')
		.reduce((prev, cur) => {
			const { key, replaces } = cur;

			const miss = replaces.filter((replace) => json[key] && json[key].indexOf(replace) === -1);

			if (miss.length > 0) {
				prev.push({ key, miss });
			}

			return prev;
		}, [] as { key: string; miss: string[] }[]);

const removeMissingKeys = async (i18nFiles: string[], usedKeys: { key: string; replaces: string[] }[]) => {
	for await (const file of i18nFiles) {
		const json = await parseFile(file);
		if (Object.keys(json).length === 0) {
			return;
		}

		validateKeys(json, usedKeys).forEach(({ key }) => {
			delete json[key];
		});

		await writeFile(file, JSON.stringify(json, null, 2), 'utf8');
	}
};

const hasDuplicatedKeys = (content: string, json: Record<string, string>) => {
	const matchKeys = content.matchAll(/^\s+"([^"]+)"/gm);

	const allKeys = [...matchKeys];

	return allKeys.length !== Object.keys(json).length;
};

const checkUniqueKeys = (content: string, json: Record<string, string>, filename: string) => {
	if (hasDuplicatedKeys(content, json)) {
		throw new Error(`Duplicated keys found on file ${filename}`);
	}
};

const validate = (i18nFiles: string[], usedKeys: { key: string; replaces: string[] }[]) => {
	const totalErrors = i18nFiles.reduce((errors, file) => {
		const content = fs.readFileSync(file, 'utf8');
		const json = JSON.parse(content);

		checkUniqueKeys(content, json, file);

		const result = validateKeys(json, usedKeys);

		if (result.length === 0) {
			return errors;
		}

		console.log('\n## File', file, `(${result.length} errors)`);

		result.forEach(({ key, miss }) => {
			console.log('\n- Key:', key, '\n  Missing variables:', miss.join(', '));
		});

		return errors + result.length;
	}, 0);

	if (totalErrors > 0) {
		throw new Error(`\n${totalErrors} errors found`);
	}
};

const parseFile = async (path: PathLike) => {
	const content = await readFile(path, 'utf8');
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

const oldPlaceholderFormat = /__[a-zA-Z_]+__/g;

const checkPlaceholdersFormat = (json: Record<string, string>, path: PathLike) => {
	const outdatedKeys = Object.entries(json)
		.map(([key, value]) => ({
			key,
			value,
			placeholders: value.match(oldPlaceholderFormat),
		}))
		.filter((outdatedKey): outdatedKey is { key: string; value: string; placeholders: RegExpMatchArray } => !!outdatedKey.placeholders);

	if (outdatedKeys.length > 0) {
		throw new Error(
			`Outdated placeholder format on file ${path}: ${outdatedKeys
				.map((key) => inspect(key, { colors: !!supportsColor.stdout }))
				.join(', ')}`,
		);
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
				if (key.endsWith(`_${pluralSuffix}`)) {
					return key.slice(0, -pluralSuffix.length);
				}
			}

			return key;
		}),
	);

	return [singularKeys, pluralSuffixes] as const;
};

const checkMissingPlurals = (json: Record<string, string>, path: PathLike, lng: string) => {
	const [singularKeys, pluralSuffixes] = extractSingularKeys(json, lng);

	const missingPluralKeys: { singularKey: string; pluralKeys: string[] }[] = [];

	for (const singularKey of singularKeys) {
		if (singularKey in json) {
			continue;
		}

		const pluralKeys = pluralSuffixes.map((suffix) => `${singularKey}_${suffix}`);

		const missingOnes = pluralKeys.filter((key) => !(key in json));

		if (missingOnes.length > 0) {
			missingPluralKeys.push({ singularKey, pluralKeys: missingOnes });
		}
	}

	if (missingPluralKeys.length > 0) {
		throw new Error(`Missing plural keys on file ${path}: ${inspect(missingPluralKeys, { colors: !!supportsColor.stdout })}`);
	}
};

const checkExceedingKeys = (
	json: Record<string, string>,
	path: PathLike,
	lng: string,
	sourceJson: Record<string, string>,
	sourceLng: string,
) => {
	const [singularKeys] = extractSingularKeys(json, lng);
	const [sourceSingularKeys] = extractSingularKeys(sourceJson, sourceLng);

	const exceedingKeys = [...singularKeys].filter((key) => !sourceSingularKeys.has(key));

	if (exceedingKeys.length > 0) {
		throw new Error(`Exceeding keys on file ${path}: ${inspect(exceedingKeys, { colors: !!supportsColor.stdout })}`);
	}
};

const checkFiles = async (sourceDirPath: string, sourceFile: string, fix = false) => {
	const sourcePath = join(sourceDirPath, sourceFile);
	const sourceJson = await parseFile(sourcePath);

	checkPlaceholdersFormat(sourceJson, sourcePath);
	checkMissingPlurals(sourceJson, sourcePath, 'en');

	const i18nFiles = await fg([join(sourceDirPath, `**/*.i18n.json`), `!${sourcePath}`]);

	const translations = await Promise.all(
		i18nFiles.map(async (path) => ({ path, json: await parseFile(path), lng: /\/(.*).i18n.json$/.exec(path)?.[1] ?? 'FIXME' })),
	);

	for await (const { path, json, lng } of translations) {
		checkPlaceholdersFormat(json, path);
		checkMissingPlurals(json, path, lng);
		checkExceedingKeys(json, path, lng, sourceJson, 'en');
	}

	const regexVar = /__[a-zA-Z_]+__/g;

	const usedKeys = Object.entries(sourceJson)
		.map(([key, value]) => {
			const replaces = value.match(regexVar);
			return {
				key,
				replaces,
			};
		})
		.filter((usedKey): usedKey is { key: string; replaces: RegExpMatchArray } => !!usedKey.replaces);

	if (fix) {
		return removeMissingKeys(i18nFiles, usedKeys);
	}

	validate(i18nFiles, usedKeys);
};

const fix = process.argv[2] === '--fix';
checkFiles('./packages/rocketchat-i18n/i18n', 'en.i18n.json', fix).catch((e) => {
	console.error(e);
	process.exit(1);
});
