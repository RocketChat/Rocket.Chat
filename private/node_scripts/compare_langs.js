var async = require('async');
var fs = require('fs');
var _ = require('underscore');
var googleTranslate = require('google-translate')('insert google api key here');

var path = '../../packages/rocketchat-lib/i18n/';
var enContents = fs.readFileSync(path + 'en.i18n.json', 'utf-8');
var en = JSON.parse(enContents);

googleTranslate.getSupportedLanguages(function(err, langs) {
	if (err) {
		console.log(err);
		return;
	}
	var files = fs.readdirSync(path);
	async.eachSeries(files, function(file, callback) {
		if (file === 'en.i18n.json') { return callback(); }

		var lang = file.replace('.i18n.json', '');
		var destContents = fs.readFileSync(path + file, 'utf-8');
		var destJson = JSON.parse(destContents);
		var toTranslate = {};
		var newContent = {};

		for (var key in en) {
			if (en.hasOwnProperty(key)) {
				if (destJson[key]) {
					newContent[key] = destJson[key];
				} else {
					newContent[key] = '';
					toTranslate[key] = en[key];
				}
			}
		}

		var invertToTranslate = _.invert(toTranslate);
		var toTranslateLang = _.keys(invertToTranslate);

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
					for (var key in translations) {
						if (translations.hasOwnProperty(key)) {
							newContent[invertToTranslate[translations[key].originalText]] = translations[key].translatedText;
						}
					}
					var newJsonString = JSON.stringify(newContent, null, '  ').replace(/": "/g, '" : "');
					fs.writeFileSync(path + file, newJsonString, 'utf8');
					setTimeout(function() { return callback(); }, 1000);
				}
			});
		} else {
			return callback();
		}
	});
});
