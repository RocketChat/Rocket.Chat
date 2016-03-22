/* globals Template */
Template.messageBox.events({
	'click .emoji-picker-icon'(event) {
		event.stopPropagation();
		if (RocketChat.EmojiPicker.isOpened()) {
			RocketChat.EmojiPicker.close();
		} else {
			EmojiPicker.open(event.currentTarget, $(event.currentTarget).parent().parent().find('.input-message'));
		}
	}
});

Template.messageBox.onCreated(function() {
	RocketChat.EmojiPicker.init();
});
