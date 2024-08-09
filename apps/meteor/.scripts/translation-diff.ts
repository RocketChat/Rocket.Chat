#!/usr/bin/env ts-node

import { readFile } from 'fs/promises';
import path from 'path';

const translationDir = path.resolve(__dirname, '../packages/rocketchat-i18n/i18n/');

async function translationDiff(source: string, target: string) {
	console.debug('loading translations from', translationDir);

	function diffKeys(a: Record<string, string>, b: Record<string, string>) {
		const diff = {};
		Object.keys(a).forEach((key) => {
			if (!b[key]) {
				diff[key] = a[key];
			}
		});

		return diff;
	}

	const sourceTranslations = JSON.parse(await readFile(`${translationDir}/${source}.i18n.json`, 'utf8'));
	const targetTranslations = JSON.parse(await readFile(`${translationDir}/${target}.i18n.json`, 'utf8'));

	return diffKeys(sourceTranslations, targetTranslations);
}

const sourceLang = process.argv[2] || 'en';
const targetLang = process.argv[3] || 'de';
translationDiff(sourceLang, targetLang).then((diff) => {
	console.log('Diff between', sourceLang, 'and', targetLang);
	console.log(JSON.stringify(diff, undefined, 2));
});
