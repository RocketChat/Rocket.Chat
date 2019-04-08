import { Meteor } from 'meteor/meteor';
import { getUserPreference } from '../../utils';
import { callbacks } from '../../callbacks';
import { emoji } from '../lib/rocketchat';
import { isSetNotNull } from './function-isSet';
import s from 'underscore.string';

/*
 * emojiParser is a function that will replace emojis
 * @param {Object} message - The message object
 */
callbacks.add('renderMessage', (message) => {
	if (isSetNotNull(() => getUserPreference(Meteor.userId(), 'useEmojis')) &&
		!getUserPreference(Meteor.userId(), 'useEmojis')) {
		return message;
	}

	if (s.trim(message.html)) {
		// &#39; to apostrophe (') for emojis such as :')
		message.html = message.html.replace(/&#39;/g, '\'');

		// '<br>' to ' <br> ' for emojis such at line breaks
		message.html = message.html.replace(/<br>/g, ' <br> ');

		Object.keys(emoji.packages).forEach((emojiPackage) => {
			message.html = emoji.packages[emojiPackage].render(message.html);
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

				if (s.trim(child.text()) === '') {
					continue;
				}

				emojiOnly = false;
				break;
			}
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
