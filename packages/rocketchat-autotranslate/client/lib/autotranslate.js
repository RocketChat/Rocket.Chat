Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('AutoTranslate_Enabled')) {
			RocketChat.callbacks.add('renderMessage', (message) => {
				if (message.u._id !== Meteor.userId()) {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1, autoTranslateDisplay: 1 } });
					if (subscription && subscription.autoTranslate === true && subscription.autoTranslateDisplay === true && subscription.autoTranslateLanguage) {
						const autoTranslateLanguage = subscription.autoTranslateLanguage;
						if (!message.translations) {
							message.translations = {};
						}
						message.translations['original'] = message.html;
						if (message.translations[autoTranslateLanguage]) {
							message.html = message.translations[autoTranslateLanguage];
						}
						return message;
					}
				}
			}, RocketChat.callbacks.priority.HIGH - 3, 'autotranslate');
		} else {
			RocketChat.callbacks.remove('renderMessage', 'autotranslate');
		}
	});
});
