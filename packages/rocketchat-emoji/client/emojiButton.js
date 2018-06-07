/* globals Template chatMessages*/
Template.messageBox.events({
	'click .emoji-picker-icon'(event) {
		event.stopPropagation();
		event.preventDefault();

		if (!RocketChat.getUserPreference(Meteor.user(), 'useEmojis')) {
			return false;
		}

		if (RocketChat.EmojiPicker.isOpened()) {
			RocketChat.EmojiPicker.close();
		} else {
			RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
				const {input} = chatMessages[RocketChat.openedRoom];

				const emojiValue = `:${ emoji }:`;

				const caretPos = input.selectionStart;
				const textAreaTxt = input.value;
				input.focus();
				if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
					input.value = textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos);
				}

				input.focus();

				input.selectionStart = caretPos + emojiValue.length;
				input.selectionEnd = caretPos + emojiValue.length;
			});
		}
	}
});

Template.messageBox.onCreated(function() {
	RocketChat.EmojiPicker.init();
});
