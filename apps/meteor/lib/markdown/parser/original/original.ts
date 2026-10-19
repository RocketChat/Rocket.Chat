/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { code } from './code';
import { markdown } from './markdown';
import type { MarkdownMessage } from './token';

export const original = <T extends MarkdownMessage & { html: string }>(
	message: T,
	options: { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string } = {
		supportSchemesForLink: 'http,https',
		headers: true,
	},
): T => {
	// Parse markdown code
	message = code(message);

	// Parse markdown
	message = markdown(message, options);

	// Replace linebreak to br
	message.html = message.html.replace(/\n/gm, '<br>');

	return message;
};
