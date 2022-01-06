import { isIE11 } from '../../../client/lib/utils/isIE11';
import { emoji } from '../lib/rocketchat';

/*
 * emojiParser is a function that will replace emojis
 * @param {Object} message - The message object
 */

const emojiParser = (message) => {
	if (!message.html?.trim()) {
		return message;
	}

	let html = message.html.trim();

	// &#39; to apostrophe (') for emojis such as :')
	html = html.replace(/&#39;/g, "'");

	// '<br>' to ' <br> ' for emojis such at line breaks
	html = html.replace(/<br>/g, ' <br> ');

	html = Object.entries(emoji.packages)
		.reverse()
		.reduce((value, [, emojiPackage]) => emojiPackage.render(value), html);

	const checkEmojiOnly = document.createElement('div');

	checkEmojiOnly.innerHTML = html;

	const emojis = Array.from(checkEmojiOnly.querySelectorAll('.emoji:not(:empty), .emojione:not(:empty)'));

	let hasText = false;

	if (!isIE11) {
		const filter = (node) => {
			if (node.nodeType === Node.ELEMENT_NODE && (node.classList.contains('emojione') || node.classList.contains('emoji'))) {
				return NodeFilter.FILTER_REJECT;
			}
			return NodeFilter.FILTER_ACCEPT;
		};

		const walker = document.createTreeWalker(checkEmojiOnly, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, filter);

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
	}

	// apostrophe (') back to &#39;
	html = html.replace(/\'/g, '&#39;');

	// line breaks ' <br> ' back to '<br>'
	html = html.replace(/ <br> /g, '<br>');

	return { ...message, html };
};

export { emojiParser };

export const createEmojiMessageRenderer = () => emojiParser;
