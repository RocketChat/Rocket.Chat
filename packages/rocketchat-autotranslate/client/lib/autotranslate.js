RocketChat.AutoTranslate = {
	messageIdsToWait: {},

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
					if (message.u && message.u._id !== Meteor.userId()) {
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

							if (message.attachments && message.attachments.length > 0) {
								message.attachments = this.translateAttachments(message.attachments, autoTranslateLanguage);
							}

							return message;
						}
					}
				}, RocketChat.callbacks.priority.HIGH - 3, 'autotranslate');

				RocketChat.callbacks.add('streamMessage', (message) => {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1, autoTranslateDisplay: 1 } });
					if (subscription && subscription.autoTranslate === true && subscription.autoTranslateLanguage && subscription.autoTranslateDisplay && (!message.translations || !message.translations[subscription.autoTranslateLanguage])) {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						this.messageIdsToWait[message._id] = true;
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
