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
			message.html = message.html.replace(/&#39;/g, '\'');

			// '<br>' to ' <br> ' for emojis such at line breaks
			message.html = message.html.replace(/<br>/g, ' <br> ');

			// URL RegEx
			const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm;

			Object.keys(emoji.packages).forEach((emojiPackage) => {
				// Divide into array
				const splitMessage = message.html.split(' ');
				for (const urlIndex in splitMessage) {
					// Only change emoji for non URLs
					if (!splitMessage[urlIndex].match(urlRegex)) {
						splitMessage[urlIndex] = emoji.packages[emojiPackage].render(splitMessage[urlIndex]);
					}
				}
				message.html = splitMessage.join(' ');
			});

			const checkEmojiOnly = $(`<div>${ message.html }</div>`);
			let emojiOnly = true;

			for (let i = 0, len = checkEmojiOnly[0].childNodes.length; i < len; i++) {
				const childNode = checkEmojiOnly[0].childNodes[i];

				if (childNode.classList && (childNode.classList.contains('emoji') || childNode.classList.contains('emojione'))) {
					childNode.classList.add('big');
					continue;
				}

				if (s.trim(childNode.innerText) === '') {
					continue;
				}

				emojiOnly = false;
				break;
			}

			if (emojiOnly) {
				message.html = checkEmojiOnly.unwrap().html();
			}

			// apostrophe (') back to &#39;
			message.html = message.html.replace(/\'/g, '&#39;');

			// apostrophe ' <br> ' back to '<br>'
			message.html = message.html.replace(/ <br> /g, '<br>');
		}

		return message;
	}, callbacks.priority.LOW, 'emoji');
});
