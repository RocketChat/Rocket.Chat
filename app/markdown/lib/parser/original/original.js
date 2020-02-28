/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import Filter from 'bad-words';

import { markdown } from './markdown.js';
import { code } from './code.js';
import { settings } from '../../../../settings';

export const original = (message) => {
	// Parse markdown code
	message = code(message);

	// Parse markdown
	message = markdown(message);

	// Replace linebreak to br
	message.html = message.html.replace(/\n/gm, '<br>');

	return message;
};

export const badWordFilter = (msg) => {
	const badWordsList = settings.get('Message_BadWordsFilterList');
	let options;

	// Add words to the blacklist
	if (!!badWordsList && badWordsList.length) {
		options = {
			list: badWordsList.split(','),
		};
	}
	const filter = new Filter(options);
	msg = filter.clean(msg);
	return msg;
};
