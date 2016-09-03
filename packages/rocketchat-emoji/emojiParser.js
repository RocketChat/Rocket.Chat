/* globals isSetNotNull */
/*
 * emojiParser is a function that will replace emojis
 * @param {Object} message - The message object
 */
RocketChat.callbacks.add('renderMessage', (message) => {
	if (isSetNotNull(() => Meteor.user().settings.preferences.useEmojis) && !Meteor.user().settings.preferences.useEmojis) {
		return message;
	}

	if (_.trim(message.html)) {
		for (let emoji in RocketChat.emoji.list) {
			if (!RocketChat.emoji.list.hasOwnProperty(emoji)) {
				continue;
			}

			let regExp = new RegExp(RegExp.escape(emoji), 'g');

			let emPackage = RocketChat.emoji.list[emoji]['emojiPackage'];

			if (regExp.test(message.html)) {
				message.html = message.html.replace(regExp, RocketChat.emoji.packages[emPackage].render(emoji));
			}
		}

		let checkEmojiOnly = $(`<div>${message.html}</div>`);
		let emojiOnly = true;
		for (let childNode in checkEmojiOnly[0].childNodes) {
			if (checkEmojiOnly[0].childNodes.hasOwnProperty(childNode)) {
				let child = $(checkEmojiOnly[0].childNodes[childNode]);

				if (child.hasClass('emoji') || child.hasClass('emojione')) {
					checkEmojiOnly[0].childNodes[childNode] = child.addClass('big');
					continue;
				}

				if (_.trim(child.text()) === '') {
					continue;
				}

				emojiOnly = false;
				break;
			}
		}

		if (emojiOnly) {
			message.html = checkEmojiOnly.unwrap().html();
		}
	}

	return message;
}, RocketChat.callbacks.priority.LOW, 'emoji');
