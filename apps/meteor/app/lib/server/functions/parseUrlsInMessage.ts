import type { IMessage } from '@rocket.chat/core-typings';

import { Markdown } from '../../../markdown/server';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';

export const parseUrlsInMessage = (message: IMessage & { parseUrls?: boolean }): IMessage => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	const urls = message.html?.match(getMessageUrlRegex()) || [];
	if (urls) {
		message.urls = [...new Set(urls)].map((url) => ({ url, meta: {} }));
	}

	message = Markdown.mountTokensBack(message, false);
	message.msg = message.html || message.msg;
	delete message.html;
	delete message.tokens;

	return message;
};
