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
		let html = s.trim(message.html);
		if (html) {
			// &#39; to apostrophe (') for emojis such as :')
			html = html.replace(/&#39;/g, '\'');

			// '<br>' to ' <br> ' for emojis such at line breaks
			html = html.replace(/<br>/g, ' <br> ');

			html = Object.entries(emoji.packages).reduce((value, [, emojiPackage]) => emojiPackage.render(value), html);

			const checkEmojiOnly = document.createElement('div');

			checkEmojiOnly.innerHTML = html;

			const emojis = Array.from(checkEmojiOnly.querySelectorAll('.emoji:not(:empty), .emojione:not(:empty)'));

			const emojiOnly = emojis.length && !Array.from(checkEmojiOnly.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((el) => el.nodeValue).join('').trim();

			if (emojiOnly) {
				for (let i = 0, len = emojis.length; i < len; i++) {
					const { classList } = emojis[i];
					classList.add('big');
				}
				html = checkEmojiOnly.innerHTML;
			}

			// apostrophe (') back to &#39;
			html = html.replace(/\'/g, '&#39;');

			// apostrophe ' <br> ' back to '<br>'
			html = html.replace(/ <br> /g, '<br>');
		}

		return { ...message, html };
	}, callbacks.priority.LOW, 'emoji');
});
