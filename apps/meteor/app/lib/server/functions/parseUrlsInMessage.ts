import type { IMessage } from '@rocket.chat/core-typings';

import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';
import { Markdown } from '../../../markdown/server';
import { settings } from '../../../settings/server';

export const parseUrlsInMessage = (message: IMessage & { parseUrls?: boolean }, previewUrls?: string[]): IMessage => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	const urls = message.html?.match(getMessageUrlRegex()) || [];
	if (urls) {
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

	return message;
};
