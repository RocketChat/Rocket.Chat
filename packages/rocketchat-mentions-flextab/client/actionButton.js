Meteor.startup(function() {
	return RocketChat.MessageAction.addButton({
		id: 'jump-to-message',
		icon: 'icon-right-hand',
		i18nLabel: 'Jump_to_message',
		context: ['mentions'],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		validation(message) {
			return message.mentionedList === true;
		},
		order: 100
	});
});
