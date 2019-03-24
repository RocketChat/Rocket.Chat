/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { markdown } from './markdown.js';
import { code } from './code.js';

import showdown from 'showdown';

export const original = (message) => {
/*	// Parse markdown code
	message = code(message);

	// Parse markdown
	message = markdown(message);*/
	const converter = new showdown.Converter({tables: true, strikethrough: true});

	message.html = converter.makeHtml(message.html);

	// Replace linebreak to br
	message.html = message.html.replace(/\n/gm, '<br>');

	return message;
};
