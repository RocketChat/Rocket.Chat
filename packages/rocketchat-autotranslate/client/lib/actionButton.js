Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('AutoTranslate_Enabled') && RocketChat.authz.hasAtLeastOnePermission(['auto-translate'])) {
			RocketChat.MessageAction.addButton({
				id: 'toggle-language',
				icon: 'icon-language',
				i18nLabel: 'Toggle_original_translated',
				context: [
					'message',
					'message-mobile'
				],
				action() {
					const message = this._arguments[1];
					const language = RocketChat.AutoTranslate.getLanguage(message.rid);
					RocketChat.MessageAction.hideDropDown();
					if ((!message.translations || !message.translations[language])) { //} && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; })) {
						RocketChat.AutoTranslate.messageIdsToWait[message._id] = true;
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					} else if (message.autoTranslateShowInverse) {
						RocketChat.models.Messages.update({ _id: message._id }, { $unset: { autoTranslateShowInverse: true } });
					} else {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true } });
					}
				},

				validation(message) {
					return message && message.u && message.u._id !== Meteor.userId();
				},

				order: 90
			});
		} else {
			RocketChat.MessageAction.removeButton('toggle-language');
		}
	});
});
