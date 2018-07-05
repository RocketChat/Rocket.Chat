/* globals isRtl */

import moment from 'moment';

Meteor.startup(() => {
  const availableLanguages = TAPi18n.getLanguages();

  const filterLanguage = language => {
    // Fix browsers having all-lowercase language settings eg. pt-br, en-us
    const regex = /([a-z]{2})-([a-z]{2})/;
    const matches = regex.exec(language);
    if (matches) {
      return `${matches[1]}-${matches[2].toUpperCase()}`;
    }

    return language;
  };

  const getBrowserLanguage = () => filterLanguage(window.navigator.userLanguage || window.navigator.language || 'en');

  const getGlobalLanguage = () => RocketChat.settings.get('Language') || 'en';

  const getUserLanguage = () => (Meteor.userId() && Meteor.user() && Meteor.user().language) || getGlobalLanguage();

  const setLanguage = (language = 'en') => {
    language = filterLanguage(language);

    if (!availableLanguages[availableLanguages]) {
      language = language.split('-').shift();
    }

    if (!language) {
      return;
    }

    document.documentElement.classList[isRtl(language) ? 'add' : 'remove']('rtl');
    TAPi18n.setLanguage(language);

    Meteor.call('loadLocale', language, (error, localeSrc) => {
      if (error) {
        console.error(error);
        return;
      }

      Function(localeSrc).call({ moment });
      moment.locale(language);
    });
  };

  window.setLanguage = setLanguage;
  window.defaultUserLanguage = () => RocketChat.settings.get('Language') || getBrowserLanguage();

  let isLanguageSet = false;
	Tracker.autorun(() => {
    const userLanguage = getUserLanguage();

		if (!isLanguageSet || localStorage.getItem('userLanguage') !== userLanguage) {
			isLanguageSet = true;
			localStorage.setItem('userLanguage', userLanguage);
			setLanguage(userLanguage);
		}
	});
});
