import type { Token } from '@rocket.chat/core-typings';

import { code } from './code';
import { markdown } from './markdown';

export const original = <TMessage extends { msg?: string; html: string; tokens?: Token[] }>(
	message: TMessage,
	options: {
		supportSchemesForLink?: string;
		headers?: boolean;
		rootUrl?: string;
	} = {
		supportSchemesForLink: 'http,https',
		headers: true,
	},
): TMessage => {
	// Parse markdown code
	message = code(message);

	// Parse markdown
	message = markdown(message, options);

	// Replace linebreak to br
	message.html = message.html.replace(/\n/gm, '<br>');

	return message;
};
