/* globals Template, EmojiPicker */
Template.messageBox.events({
	'click .emoji-picker-icon'(event) {
		event.stopPropagation();
		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
		} else {
			EmojiPicker.open(event.currentTarget, $(event.currentTarget).parent().parent().find('.input-message'));
		}
	}
});

Template.messageBox.onCreated(function() {
	EmojiPicker.init();
});
