/*globals defaultUserLanguage */
Template.loginFooter.helpers({
	LanguageVersion() {
		if (Template.instance().languageVersion.get()) {
			return TAPi18n.__('Language_Version', {
				lng: Template.instance().languageVersion.get()
			});
		}
	}
});

Template.loginFooter.events({
	'click button.switch-language'(e, t) {
		const userLanguage = t.languageVersion.get();
		localStorage.setItem('userLanguage', userLanguage);
		TAPi18n.setLanguage(userLanguage);
		moment.locale(userLanguage);
		return t.languageVersion.set(userLanguage !== defaultUserLanguage() ? defaultUserLanguage() : 'en');
	}
});

Template.loginFooter.onCreated(function() {
	const self = this;
	this.languageVersion = new ReactiveVar;
	const userLanguage = localStorage.getItem('userLanguage');
	if (userLanguage !== defaultUserLanguage()) {
		return TAPi18n._loadLanguage(defaultUserLanguage()).done(function() {
			return self.languageVersion.set(defaultUserLanguage());
		});
	} else if (userLanguage.indexOf('en') !== 0) {
		return TAPi18n._loadLanguage('en').done(function() {
			return self.languageVersion.set('en');
		});
	}
});
