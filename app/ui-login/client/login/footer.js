import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../settings';
import { filterLanguage } from '../../../../client/lib/utils/filterLanguage';

const loadLanguage = async (language = 'en') => {
	const loadedLanguage = filterLanguage(language);
	await TAPi18n._loadLanguage(loadedLanguage);
	window.setLanguage(loadedLanguage);

	return loadedLanguage;
};

const getSuggestedLanguage = (loadedLanguage) => {
	const serverLanguage = filterLanguage(settings.get('Language'));

	if (serverLanguage !== loadedLanguage) {
		return serverLanguage;
	}

	if (serverLanguage !== 'en') {
		return 'en';
	}

	return undefined;
};

Template.loginFooter.onCreated(function () {
	const currentLanguage = filterLanguage(Meteor._localStorage.getItem('userLanguage'));
	this.suggestedLanguage = new ReactiveVar(getSuggestedLanguage(currentLanguage));

	loadLanguage(currentLanguage);
});

Template.loginFooter.helpers({
	lng() {
		return Template.instance().suggestedLanguage.get();
	},
	lngObj(lng) {
		return { lng };
	},
});

Template.loginFooter.events({
	'click button.js-switch-language'(e, t) {
		e.preventDefault();

		const language = t.suggestedLanguage.get();
		t.suggestedLanguage.set(getSuggestedLanguage(t.suggestedLanguage.get()));

		loadLanguage(language);
	},
});
