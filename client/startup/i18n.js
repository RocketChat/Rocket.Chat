/* globals isRtl */

import moment from 'moment';

const currentLanguage = new ReactiveVar();

Meteor.startup(() => {
	TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');
	currentLanguage.set(localStorage.getItem('userLanguage'));

	const availableLanguages = TAPi18n.getLanguages();

	const filterLanguage = language => {
		// Fix browsers having all-lowercase language settings eg. pt-br, en-us
		const regex = /([a-z]{2})-([a-z]{2})/;
		const matches = regex.exec(language);
		if (matches) {
			return `${ matches[1] }-${ matches[2].toUpperCase() }`;
		}

		return language;
	};

	const getBrowserLanguage = () => filterLanguage(window.navigator.userLanguage || window.navigator.language);

	const getServerLanguage = () => RocketChat.settings.get('Language');

	const getUserLanguage = () => (Meteor.userId() && Meteor.user() && Meteor.user().language);

	const loadMomentLocale = language => new Promise((resolve, reject) => {
		if (language === 'en') {
			resolve('en');
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
		loadMomentLocale(language).then(locale => moment.locale(locale), error => console.error(error));
	};

	const setLanguage = language => {
		currentLanguage.set(filterLanguage(language));
		localStorage.setItem('userLanguage', currentLanguage.get());
	};

	window.setLanguage = setLanguage;

	window.defaultUserLanguage = () => RocketChat.settings.get('Language') || getBrowserLanguage() || 'en';

	Tracker.autorun(() => {
		if (!currentLanguage.get()) {
			setLanguage(getUserLanguage() || getServerLanguage() || 'en');
		}

		applyLanguage(currentLanguage.get());
	});
});
