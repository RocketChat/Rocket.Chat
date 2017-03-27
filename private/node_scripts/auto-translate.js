const async = require('async');
const fs = require('fs');
const _ = require('underscore');

if (!process.argv[2]) {
	console.error('\You must inform you Google API key: node auto-translate.js [google-api-key]\n');
	process.exit();
}

const googleTranslate = require('google-translate')(process.argv[2]);

googleTranslate.getSupportedLanguages(function(err, langs) {
	if (err) {
		console.log(err);
		return;
	}

	async.eachSeries(['../../packages/rocketchat-lib/i18n/', '../../packages/rocketchat-livechat/app/i18n/'], function(path, callback) {
		console.log(`Translating files in: ${ path }`);
		const enContents = fs.readFileSync(`${ path }en.i18n.json`, 'utf-8');
		const enUnsorted = JSON.parse(enContents);
		const en = {};
		_.keys(enUnsorted).sort(function(a, b) {
			if (a.toLowerCase() !== b.toLowerCase()) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			} else {
				return a.localeCompare(b);
			}
		}).forEach(function(key) {
			en[key] = enUnsorted[key];
		});
		fs.writeFileSync(`${ path }en.i18n.json`, JSON.stringify(en, null, '  ').replace(/": "/g, '" : "'), 'utf8');

		const files = fs.readdirSync(path);
		async.eachSeries(files, function(file, callback) {
			if (file === 'en.i18n.json') { return callback(); }

			let lang = file.replace('.i18n.json', '');

			if (lang === 'ug' || lang === 'zh-HK') {
				return callback();
			}

			const destContents = fs.readFileSync(path + file, 'utf-8');
			const destJson = JSON.parse(destContents);
			const toTranslate = {};
			const newContent = {};

			for (let key in en) {
				if (en.hasOwnProperty(key)) {
					key = `${ key }`;
					if (destJson[key]) {
						newContent[key] = destJson[key];
					} else {
						newContent[key] = '';
						toTranslate[key] = en[key];
					}
				}
			}

			const invertToTranslate = _.invert(toTranslate);
			const toTranslateLang = _.keys(invertToTranslate);

			if (lang === 'ms-MY') {
				lang = 'ms';
			}

			if (lang === 'ta-IN') {
				lang = 'ta';
			}

			if (lang === 'he') {
				lang = 'iw';
			}

			if (langs.indexOf(lang) !== -1 && toTranslateLang.length > 1) {
				console.log(lang, toTranslateLang.length);
				googleTranslate.translate(toTranslateLang, 'en', lang, function(err, translations) {
					if (err) {
						console.log(lang, err);
					} else {
						for (const key in translations) {
							if (translations.hasOwnProperty(key)) {
								newContent[invertToTranslate[translations[key].originalText]] = translations[key].translatedText;
							}
						}
						const newJsonString = JSON.stringify(newContent, null, '  ').replace(/": "/g, '" : "');
						fs.writeFileSync(path + file, newJsonString, 'utf8');
						setTimeout(function() { return callback(); }, 1000);
					}
				});
			} else {
				const newJsonString = JSON.stringify(newContent, null, '  ').replace(/": "/g, '" : "');
				fs.writeFileSync(path + file, newJsonString, 'utf8');
				return callback();
			}
		}, function() {
			return callback();
		});
	});
});
