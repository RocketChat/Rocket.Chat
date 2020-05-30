import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../settings';

const filterLanguage = (language) => {
	// Fix browsers having all-lowercase language settings eg. pt-br, en-us
	const regex = /([a-z]{2,3})-([a-z]{2,4})/;
	const matches = regex.exec(language);
	if (matches) {
		return `${ matches[1] }-${ matches[2].toUpperCase() }`;
	}

	return language;
};

Template.loginFooter.onCreated(function() {
	this.suggestedLanguage = new ReactiveVar();

	const loadAndSetSuggestedLanguage = async (language = 'en') => {
		const lng = filterLanguage(language);
		try {
			await TAPi18n._loadLanguage(filterLanguage(lng));
			window.setLanguage(lng);

			const serverLanguage = filterLanguage(settings.get('Language'));

			if (serverLanguage !== lng) {
				return serverLanguage;
			}
			if (serverLanguage !== 'en') {
				return 'en';
			}
		} catch (e) {
			return null;
		}
	};

	this.suggestAnotherLanguageFor = async (language) => {
		const suggest = await loadAndSetSuggestedLanguage(language);
		this.suggestedLanguage.set(suggest);
	};

	const currentLanguage = Meteor._localStorage.getItem('userLanguage');
	this.suggestAnotherLanguageFor(currentLanguage);
});

Template.loginFooter.helpers({
	languageVersion() {
		const lng = Template.instance().suggestedLanguage.get();
		return lng && TAPi18n.__('Language_Version', { lng });
	},
});

Template.loginFooter.events({
	'click button.js-switch-language'(e, t) {
		const language = t.suggestedLanguage.get();
		t.suggestAnotherLanguageFor(language);
		return false;
	},
});
