RocketChat.AutoTranslate = {
	messageIdsToWait: {},

	init() {
		Tracker.autorun(() => {
			if (RocketChat.settings.get('AutoTranslate_Enabled') && RocketChat.authz.hasAtLeastOnePermission(['auto-translate'])) {
				RocketChat.callbacks.add('renderMessage', (message) => {
					if (message.u._id !== Meteor.userId()) {
						const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1, autoTranslateDisplay: 1 } });
						if (subscription && subscription.autoTranslate === true && subscription.autoTranslateLanguage && !!subscription.autoTranslateDisplay !== !!message.autoTranslateShowInverse) {
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

				RocketChat.callbacks.add('streamMessage', (message) => {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1, autoTranslateDisplay: 1 } });
					if (subscription && subscription.autoTranslate === true && subscription.autoTranslateLanguage && subscription.autoTranslateDisplay && (!message.translations || !message.translations[subscription.autoTranslateLanguage])) {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
					}
					if (this.messageIdsToWait[message._id] !== undefined) {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true }, $unset: { autoTranslateFetching: 1 } });
						delete this.messageIdsToWait[message._id];
					}
				}, RocketChat.callbacks.priority.HIGH - 3, 'autotranslate-stream');
			} else {
				RocketChat.callbacks.remove('renderMessage', 'autotranslate');
				RocketChat.callbacks.remove('streamMessage', 'autotranslate-stream');
			}
		});
	}
};

Meteor.startup(function() {
	RocketChat.AutoTranslate.init();
});
