import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/tap:i18n';
import { isRtl } from '/app/utils';
import { settings } from '/app/settings';
import { Users } from '/app/models';
import moment from 'moment';

const currentLanguage = new ReactiveVar();

Meteor.startup(() => {
	TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');
	currentLanguage.set(localStorage.getItem('userLanguage'));

	const availableLanguages = TAPi18n.getLanguages();

	const filterLanguage = (language) => {
		// Fix browsers having all-lowercase language settings eg. pt-br, en-us
		const regex = /([a-z]{2})-([a-z]{2})/;
		const matches = regex.exec(language);
		if (matches) {
			return `${ matches[1] }-${ matches[2].toUpperCase() }`;
		}

		return language;
	};

	const getBrowserLanguage = () => filterLanguage(window.navigator.userLanguage || window.navigator.language);

	const loadMomentLocale = (language) => new Promise((resolve, reject) => {
		if (moment.locales().includes(language.toLowerCase())) {
			resolve(language);
			return;
		}

		Meteor.call('loadLocale', language, (error, localeSrc) => {
			if (error) {
				reject(error);
				return;
			}

			Function(localeSrc).call({ moment });
			resolve(language);
		});
	});

	const applyLanguage = (language = 'en') => {
		language = filterLanguage(language);

		if (!availableLanguages[language]) {
			language = language.split('-').shift();
		}

		if (!language) {
			return;
		}

		document.documentElement.classList[isRtl(language) ? 'add' : 'remove']('rtl');
		TAPi18n.setLanguage(language);
		loadMomentLocale(language).then((locale) => moment.locale(locale), (error) => console.error(error));
	};

	const setLanguage = (language) => {
		const lang = filterLanguage(language);
		currentLanguage.set(lang);
		localStorage.setItem('userLanguage', lang);
	};
	window.setLanguage = setLanguage;

	const defaultUserLanguage = () => settings.get('Language') || getBrowserLanguage() || 'en';
	window.defaultUserLanguage = defaultUserLanguage;

	Tracker.autorun(() => {
		const user = Users.findOne(Meteor.userId(), { fields: { language: 1 } });

		setLanguage((user && user.language) || defaultUserLanguage());
	});

	Tracker.autorun(() => {
		if (currentLanguage.get()) {
			applyLanguage(currentLanguage.get());
		}
	});
});
