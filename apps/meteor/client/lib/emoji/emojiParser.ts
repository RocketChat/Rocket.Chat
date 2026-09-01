import { emoji } from './lib';

// Escapes a plain text value into its HTML representation so it can be safely
// reinserted via innerHTML after emoji rendering (e.g. `<` becomes `&lt;`).
const escapeHtml = (value: string): string => {
	const escaper = document.createElement('div');
	escaper.textContent = value;
	return escaper.innerHTML;
};

const renderEmojiPackages = (value: string): string =>
	Object.entries(emoji.packages)
		.reverse()
		.reduce((rendered, [, emojiPackage]) => emojiPackage.render(rendered), value);

/**
 * emojiParser is a function that will replace emojis
 */
export const emojiParser = (html: string) => {
	html = html.trim();

	// &#39; to apostrophe (') for emojis such as :')
	html = html.replace(/&#39;/g, "'");

	// '<br>' to ' <br> ' for emojis such at line breaks
	html = html.replace(/<br>/g, ' <br> ');

	const checkEmojiOnly = document.createElement('div');

	checkEmojiOnly.innerHTML = html;

	// Render emojis only inside text nodes so shortcodes that live in markup
	// (e.g. a URL containing `:smile:` in an anchor's href) stay untouched.
	// Emojis inside code blocks are intentionally left as their literal shortcode.
	const textWalker = document.createTreeWalker(checkEmojiOnly, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => (node.parentElement?.closest('code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
	});

	const textNodes: Text[] = [];
	while (textWalker.nextNode()) {
		textNodes.push(textWalker.currentNode as Text);
	}

	textNodes.forEach((textNode) => {
		const escaped = escapeHtml(textNode.nodeValue ?? '');
		const rendered = renderEmojiPackages(escaped);

		if (rendered === escaped) {
			return;
		}

		const fragmentHolder = document.createElement('span');
		fragmentHolder.innerHTML = rendered;
		textNode.replaceWith(...Array.from(fragmentHolder.childNodes));
	});

	const emojis = Array.from(checkEmojiOnly.querySelectorAll('.emoji:not(:empty)'));

	let hasText = false;

	const isElement = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE;

	const isTextNode = (node: Node): node is Text => node.nodeType === Node.TEXT_NODE;

	const filter = (node: Node) => {
		if (isElement(node) && node.classList.contains('emoji')) {
			return NodeFilter.FILTER_REJECT;
		}
		return NodeFilter.FILTER_ACCEPT;
	};

	const walker = document.createTreeWalker(checkEmojiOnly, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, filter);

	while (walker.nextNode()) {
		if (isTextNode(walker.currentNode) && walker.currentNode.nodeValue.trim() !== '') {
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
	}

	html = checkEmojiOnly.innerHTML;

	// apostrophe (') back to &#39;
	html = html.replace(/\'/g, '&#39;');

	// line breaks ' <br> ' back to '<br>'
	html = html.replace(/ <br> /g, '<br>');

	return html;
};
