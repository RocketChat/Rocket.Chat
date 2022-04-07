#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const util = require('util');

// Convert fs.readFile into Promise version of same
const readFile = util.promisify(fs.readFile);

const translationDir = path.resolve(__dirname, '../packages/rocketchat-i18n/i18n/');

async function translationDiff(source, target) {
	console.debug('loading translations from', translationDir);

	function diffKeys(a, b) {
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

console.log('Note: You can set the source and target language of the comparison with env-variables SOURCE/TARGET_LANGUAGE');
const sourceLang = process.env.SOURCE_LANGUAGE || 'en';
const targetLang = process.env.TARGET_LANGUAGE || 'de';
translationDiff(sourceLang, targetLang).then((diff) => {
	console.log('Diff between', sourceLang, 'and', targetLang);
	console.log(JSON.stringify(diff, '', 2));
});
