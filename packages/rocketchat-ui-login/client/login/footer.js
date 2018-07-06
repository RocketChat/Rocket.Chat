Template.loginFooter.onCreated(function() {
	this.suggestedLanguage = new ReactiveVar();

	const suggestLanguage = language => TAPi18n._loadLanguage(language).then(() => this.suggestedLanguage.set(language));

	this.autorun(() => {
		const userLanguage = localStorage.getItem('userLanguage');
		const serverLanguage = RocketChat.settings.get('Language') || 'en';

		if (userLanguage !== serverLanguage) {
			suggestLanguage(serverLanguage);
			return;
		}

		if (!/^en/.test(userLanguage)) {
			suggestLanguage('en');
			return;
		}
	});
});

Template.loginFooter.helpers({
	languageVersion() {
		const lng = Template.instance().suggestedLanguage.get();
		return lng && TAPi18n.__('Language_Version', { lng });
	}
});

Template.loginFooter.events({
	'click button.js-switch-language'(e, t) {
		const language = t.suggestedLanguage.get();
		localStorage.setItem('userLanguage', language);
		window.setLanguage(language);
		t.suggestedLanguage.set(undefined);
	}
});
