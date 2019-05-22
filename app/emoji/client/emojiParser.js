import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getUserPreference } from '../../utils';
import { callbacks } from '../../callbacks';
import { emoji } from '../lib/rocketchat';

/*
 * emojiParser is a function that will replace emojis
 * @param {Object} message - The message object
 */

Tracker.autorun(() => {
	if (!getUserPreference(Meteor.userId(), 'useEmojis')) {
		return callbacks.remove('renderMessage', 'emoji');
	}
	callbacks.add('renderMessage', (message) => {
		if (s.trim(message.html)) {
			// &#39; to apostrophe (') for emojis such as :')
			message.html = s.trim(message.html.replace(/&#39;/g, '\''));

			// '<br>' to ' <br> ' for emojis such at line breaks
			message.html = message.html.replace(/<br>/g, ' <br> ');

			message.html = Object.entries(emoji.packages).reduce((value, [, emojiPackage]) => emojiPackage.render(value), message.html);

			const checkEmojiOnly = document.createElement('div');

			checkEmojiOnly.innerHTML = message.html;

			const emojis = Array.from(checkEmojiOnly.querySelectorAll('.emoji:not(:empty), .emojione:not(:empty)'));

			for (let i = 0, len = emojis.length; i < len; i++) {
				const { classList } = emojis[i];
				classList.add('big');
			}
			const emojiOnly = checkEmojiOnly.childNodes.length === emojis.length;

			if (emojiOnly) {
				message.html = checkEmojiOnly.innerHTML;
			}

			// apostrophe (') back to &#39;
			message.html = message.html.replace(/\'/g, '&#39;');

			// apostrophe ' <br> ' back to '<br>'
			message.html = message.html.replace(/ <br> /g, '<br>');
		}

		return message;
	}, callbacks.priority.LOW, 'emoji');
});
