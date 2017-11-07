import _ from 'underscore';
import s from 'underscore.string';

function flat(obj, newObj = {}, path = '') {
	for (const key of Object.keys(obj)) {
		const value = obj[key];

		if (_.isObject(value)) {
			flat(value, newObj, `${ key }.`);
		} else {
			newObj[path + key] = value;
		}
	}

	return newObj;
}

RocketChat.i18nValidation = function i18nValidation() {
	const l = {};
	const keys = {};
	const errors = [];
	const langs = Object.keys(TAPi18next.options.resStore);

	for (const lang of Object.keys(TAPi18next.options.resStore)) {
		const value = TAPi18next.options.resStore[lang];

		l[lang] = flat(value);

		for (const key of Object.keys(l[lang])) {
			if (keys[key] == null) {
				keys[key] = [];
			}
			keys[key].push(lang);
		}
	}

	let len = 0;
	for (const key of Object.keys(keys)) {
		const present = keys[key];

		if (!(present.length !== langs.length)) {
			continue;
		}

		const error = (`${ _.difference(langs, present).join(',') }: missing translation for `).red + key.white + (`. Present in [${ present.join(',') }]`).red;

		errors.push(error);

		if (error.length > len) {
			len = error.length;
		}
	}

	if (errors.length > 0) {
		console.log('+'.red + s.rpad('', len - 28, '-').red + '+'.red);

		for (const error of errors) {
			console.log('|'.red, s.rpad(`${ error }`, len).red, '|'.red);
		}

		return console.log('+'.red + s.rpad('', len - 28, '-').red + '+'.red);
	}
};

// Meteor.startup(function() {
// 	RocketChat.i18nValidation();
// });
