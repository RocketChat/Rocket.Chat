import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

Template.loginFooter.onCreated(function() {
	this.suggestedLanguage = new ReactiveVar();

	this.suggestAnotherLanguageFor = (language) => {
		const loadAndSetSuggestedLanguage = (language) => TAPi18n._loadLanguage(language)
			.then(() => this.suggestedLanguage.set(language));

		const serverLanguage = RocketChat.settings.get('Language');

		if (serverLanguage !== language) {
			loadAndSetSuggestedLanguage(serverLanguage || 'en');
		} else if (!/^en/.test(language)) {
			loadAndSetSuggestedLanguage('en');
		} else {
			this.suggestedLanguage.set(undefined);
		}
	};

	const currentLanguage = localStorage.getItem('userLanguage');
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
		window.setLanguage(language);
		t.suggestAnotherLanguageFor(language);
		return false;
	},
});
