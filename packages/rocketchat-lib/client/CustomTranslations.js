Meteor.startup(function() {
	Meteor.autorun(function() {
		let CustomTranslations = RocketChat.settings.get('Custom_Translations');
		try {
			CustomTranslations = JSON.parse(CustomTranslations);
		} catch (e) {
			console.error('Invalid setting Custom_Translations', e);
		}

		for (const lang in CustomTranslations) {
			if (CustomTranslations.hasOwnProperty(lang)) {
				const translations = CustomTranslations[lang];
				TAPi18next.addResourceBundle(lang, 'project', translations);
			}
		}
	});
});
