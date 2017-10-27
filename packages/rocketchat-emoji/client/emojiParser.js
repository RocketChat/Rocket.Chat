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
		//&#39; to apostrophe (') for emojis such as :')
		message.html = message.html.replace(/&#39;/g, '\'');

		Object.keys(RocketChat.emoji.packages).forEach((emojiPackage) => {
			message.html = RocketChat.emoji.packages[emojiPackage].render(message.html);
		});

		const checkEmojiOnly = $(`<div>${ message.html }</div>`);
		let emojiOnly = true;
		for (const childNode in checkEmojiOnly[0].childNodes) {
			if (checkEmojiOnly[0].childNodes.hasOwnProperty(childNode)) {
				const child = $(checkEmojiOnly[0].childNodes[childNode]);

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

		//apostrophe (') back to &#39;
		message.html = message.html.replace(/\'/g, '&#39;');
	}

	return message;
}, RocketChat.callbacks.priority.LOW, 'emoji');
