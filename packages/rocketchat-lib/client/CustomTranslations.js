RocketChat.applyCustomTranslations = function applyCustomTranslations() {
	let CustomTranslations = RocketChat.settings.get('Custom_Translations');
	if (typeof CustomTranslations === 'string' && CustomTranslations.trim() !== '') {
		try {
			CustomTranslations = JSON.parse(CustomTranslations);

			for (const lang in CustomTranslations) {
				if (CustomTranslations.hasOwnProperty(lang)) {
					const translations = CustomTranslations[lang];
					TAPi18next.addResourceBundle(lang, 'project', translations);
				}
			}
			TAPi18n._language_changed_tracker.changed();
		} catch (e) {
			console.error('Invalid setting Custom_Translations', e);
		}
	}
};

Meteor.startup(function() {
	Meteor.autorun(function() {
		// Re apply translations if tap language was changed
		Session.get(TAPi18n._loaded_lang_session_key);
		RocketChat.applyCustomTranslations();
	});
});
