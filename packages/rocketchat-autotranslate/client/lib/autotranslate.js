RocketChat.AutoTranslate = {
	translateAttachments(attachments, language) {
		for (const attachment of attachments) {
			if (attachment.text && attachment.translations && attachment.translations[language]) {
				attachment.text = attachment.translations[language];
			}

			if (attachment.description && attachment.translations && attachment.translations[language]) {
				attachment.description = attachment.translations[language];
			}

			if (attachment.attachments && attachment.attachments.length > 0) {
				attachment.attachments = this.translateAttachments(attachment.attachments, language);
			}
		}
		return attachments;
	},

	init() {
		Tracker.autorun(() => {
			if (RocketChat.settings.get('AutoTranslate_Enabled') && RocketChat.authz.hasAtLeastOnePermission(['auto-translate'])) {
				RocketChat.callbacks.add('renderMessage', (message) => {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
					if (subscription && subscription.autoTranslateLanguage) {
						const autoTranslateLanguage = subscription.autoTranslateLanguage;
						if (message.u && message.u._id !== Meteor.userId()) {
							if (!message.translations) {
								message.translations = {};
							}
							if ((subscription.autoTranslate === true && message.autoTranslateShowInverse !== true) || (subscription.autoTranslate !== true && message.autoTranslateShowInverse === true)) {
								message.translations['original'] = message.html;
								if (message.translations[autoTranslateLanguage]) {
									message.html = message.translations[autoTranslateLanguage];
								}

								if (message.attachments && message.attachments.length > 0) {
									message.attachments = this.translateAttachments(message.attachments, autoTranslateLanguage);
								}
							}
						} else if (message.attachments && message.attachments.length > 0) {
							message.attachments = this.translateAttachments(message.attachments, autoTranslateLanguage);
						}
						return message;
					}
				}, RocketChat.callbacks.priority.HIGH - 3, 'autotranslate');

				RocketChat.callbacks.add('streamMessage', (message) => {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
					if (subscription && subscription.autoTranslate === true && subscription.autoTranslateLanguage && (!message.translations || !message.translations[subscription.autoTranslateLanguage] || (message.attachments && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[subscription.autoTranslateLanguage]; })))) {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
					}
					RocketChat.models.Messages.update({ _id: message._id, autoTranslateFetching: true }, { $set: { autoTranslateShowInverse: true }, $unset: { autoTranslateFetching: 1 } });
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
