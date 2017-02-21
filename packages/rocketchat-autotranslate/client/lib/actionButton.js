Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'show-original-message',
		icon: 'icon-language',
		i18nLabel: 'Show_original_message',
		context: [
			'message',
			'message-mobile'
		],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			RocketChat.models.Messages.update({ _id: message._id }, { $set: { autoTranslateShowOriginal: true } });
		},

		validation(message) {
			return message && !message.autoTranslateShowOriginal && message.u && message.u._id !== Meteor.userId();
		},

		order: 90
	});

	RocketChat.MessageAction.addButton({
		id: 'show-translated-message',
		icon: 'icon-language',
		i18nLabel: 'Show_translated_message',
		context: [
			'message',
			'message-mobile'
		],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			RocketChat.models.Messages.update({ _id: message._id }, { $unset: { autoTranslateShowOriginal: 1 } });
		},

		validation(message) {
			return message && message.autoTranslateShowOriginal && message.u && message.u._id !== Meteor.userId();
		},

		order: 90
	});
});
