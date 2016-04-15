var async = require('async');
var fs = require('fs');
var _ = require('underscore');
var googleTranslate = require('google-translate')('AIzaSyCrXsIW7UrXrx2_VDYWwo5prYk5DIo-SlM');

var path = '../rocket.chat/packages/rocketchat-lib/i18n/';
var enContents = fs.readFileSync(path + 'en.i18n.json', 'utf-8');
var en = JSON.parse(enContents);

googleTranslate.getSupportedLanguages(function(err, langs) {
	if (err) {
		console.log(err);
		return;
	}
	files = fs.readdirSync(path);
	async.each(files, function(file, callback) {
		if (file === 'en.i18n.json') return callback();

		var lang = file.replace('.i18n.json', '');
		var destContents = fs.readFileSync(path + file, 'utf-8');
		var destJson = JSON.parse(destContents);

		var toTranslate = {};
		var newContent = {};

		for (key in en) {
			if (destJson[key]) {
				newContent[key] = destJson[key];
			} else {
				newContent[key] = '';
				toTranslate[key] = en[key];
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
			googleTranslate.translate(toTranslateLang, 'en', lang, function(err, translations) {
				if (err) {
					console.log(lang, err);
				} else {
					for (key in translations) {
						newContent[invertToTranslate[translations[key].originalText]] = translations[key].translatedText;
					}
					var newJsonString = JSON.stringify(newContent, null, '  ').replace(/": "/g, '" : "');
					fs.writeFileSync(path + file, newJsonString, 'utf8');
					return callback();
				}
			});
		}
	});
});
