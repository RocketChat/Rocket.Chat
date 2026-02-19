import type { IMessage, AtLeast } from '@rocket.chat/core-typings';

import { extractUrlsFromMessageAST } from './extractUrlsFromMessageAST';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';
import { Markdown } from '../../../markdown/server';
import { settings } from '../../../settings/server';

// TODO move this function to message service to be used like a "beforeSaveMessage" hook
export const parseUrlsInMessage = (message: AtLeast<IMessage, 'msg'> & { parseUrls?: boolean }, previewUrls?: string[]) => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	const urls: string[] = [];

	// Also extract URLs from message blocks if they exist
	if (message.md) {
		const astUrls = extractUrlsFromMessageAST(message.md);
		urls.push(...astUrls);
	}

	// Parse the message to extract URLs from links without schema
	// The message parser converts links like "github.com" to proper links with "//" prefix
	if (!message.md) {
		const htmlUrls = message.html?.match(getMessageUrlRegex()) || [];
		urls.push(...htmlUrls);
	}

	if (urls.length > 0) {
		message.urls = [...new Set(urls)].map((url) => ({
			url,
			meta: {},
			...(previewUrls && !previewUrls.includes(url) && !url.includes(settings.get('Site_Url')) && { ignoreParse: true }),
		}));
	}

	message = Markdown.mountTokensBack(message, false);
	message.msg = message.html || message.msg;
	delete message.html;
	delete message.tokens;
};
