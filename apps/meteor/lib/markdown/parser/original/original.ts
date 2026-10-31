/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { code } from './code';
import { markdown } from './markdown';

export const original = (
	message: any,
	options: { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string } = {
		supportSchemesForLink: 'http,https',
		headers: true,
	},
) => {
	// Parse markdown code
	message = code(message);

	// Parse markdown
	message = markdown(message, options);

	// Replace linebreak to br
	message.html = message.html.replace(/\n/gm, '<br>');

	return message;
};
