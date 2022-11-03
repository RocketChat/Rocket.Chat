import { Markdown } from '../../../markdown/server';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex.ts';

export const parseUrlsInMessage = (message) => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	const urls = message.html.match(getMessageUrlRegex()) || [];
	if (urls) {
		message.urls = [...new Set(urls)].map((url) => ({ url }));
	}

	message = Markdown.mountTokensBack(message, false);
	message.msg = message.html;
	delete message.html;
	delete message.tokens;

	return message;
};
