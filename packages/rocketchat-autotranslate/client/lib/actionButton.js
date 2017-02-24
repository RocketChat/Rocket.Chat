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
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid, 'u._id': Meteor.userId() });
					RocketChat.MessageAction.hideDropDown();
					if ((!message.translations || !message.translations[subscription && subscription.autoTranslateLanguage]) && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[subscription.autoTranslateLanguage]; })) {
						if (!subscription.autoTranslateDisplay) {
							RocketChat.AutoTranslate.messageIdsToWait[message._id] = true;
						}
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message);
					} else if (message.autoTranslateShowInverse) {
						RocketChat.models.Messages.update({ _id: message._id }, { $unset: { autoTranslateShowInverse: true } });
					} else {
						RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true } });
					}
				},

				validation(message) {
					const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid, 'u._id': Meteor.userId() });
					return message && message.u && message.u._id !== Meteor.userId() && subscription.autoTranslate === true && subscription.autoTranslateLanguage;
				},

				order: 90
			});
		} else {
			RocketChat.MessageAction.removeButton('toggle-language');
		}
	});
});
