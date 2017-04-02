RocketChat.AutoTranslate = {
	messageIdsToWait: {},
	supportedLanguages: [],

	getLanguage(rid) {
		let subscription = {};
		if (rid) {
			subscription = RocketChat.models.Subscriptions.findOne({ rid }, { fields: { autoTranslateLanguage: 1 } });
		}
		const language = subscription && subscription.autoTranslateLanguage || Meteor.user().language || window.defaultUserLanguage();
		if (language.indexOf('-') !== -1) {
			if (!_.findWhere(this.supportedLanguages, { language })) {
				return language.substr(0, 2);
			}
		}
		return language;
	},

	translateAttachments(attachments, language) {
		for (const attachment of attachments) {
			if (attachment.author_name !== Meteor.user().username) {
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
		}
		return attachments;
	},

	init() {
		Meteor.call('autoTranslate.getSupportedLanguages', 'en', (err, languages) => {
			this.supportedLanguages = languages || [];
		});

		Tracker.autorun(() => {
			if (RocketChat.settings.get('AutoTranslate_Enabled') && RocketChat.authz.hasAtLeastOnePermission(['auto-translate'])) {
				RocketChat.callbacks.add('renderMessage', (message) => {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
					const autoTranslateLanguage = this.getLanguage(message.rid);
					if (message.u && message.u._id !== Meteor.userId()) {
						if (!message.translations) {
							message.translations = {};
						}
						if (subscription && subscription.autoTranslate !== message.autoTranslateShowInverse) {
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
				}, RocketChat.callbacks.priority.HIGH - 3, 'autotranslate');

				RocketChat.callbacks.add('streamMessage', (message) => {
					if (message.u && message.u._id !== Meteor.userId()) {
						const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
						const language = this.getLanguage(message.rid);
						if (subscription && subscription.autoTranslate === true && ((message.msg && (!message.translations || !message.translations[language])))) { // || (message.attachments && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; }))
							RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						} else if (this.messageIdsToWait[message._id] !== undefined && subscription && subscription.autoTranslate !== true) {
							RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true }, $unset: { autoTranslateFetching: true } });
							delete this.messageIdsToWait[message._id];
						} else if (message.autoTranslateFetching === true) {
							RocketChat.models.Messages.update({ _id: message._id }, { $unset: { autoTranslateFetching: true } });
						}
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
