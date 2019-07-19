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

			const walker = document.createTreeWalker(
				checkEmojiOnly,
				NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
				{
					acceptNode: (node) => {
						if (node.nodeType === Node.ELEMENT_NODE && (
							node.classList.contains('emojione')
							|| node.classList.contains('emoji')
						)) {
							return NodeFilter.FILTER_REJECT;
						}
						return NodeFilter.FILTER_ACCEPT;
					},
				},
			);

			let hasText = false;

			while (walker.nextNode()) {
				if (walker.currentNode.nodeType === Node.TEXT_NODE && walker.currentNode.nodeValue.trim() !== '') {
					hasText = true;
					break;
				}
			}

			const emojiOnly = emojis.length && !hasText;

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
