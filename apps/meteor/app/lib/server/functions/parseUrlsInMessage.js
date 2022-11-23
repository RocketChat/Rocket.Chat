import { Markdown } from '../../../markdown/server';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex.ts';

export const parseUrlsInMessage = (message) => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	let urls = message.html.match(getMessageUrlRegex()) || [];

	urls = urls.map((url) => {
		if (!/^https?:\/\//i.test(url)) {
			return `https://${url}`;
		}

		return url;
	});

	if (urls) {
		message.urls = [...new Set(urls)].map((url) => ({ url }));
	}

	message = Markdown.mountTokensBack(message, false);
	message.msg = message.html;
	delete message.html;
	delete message.tokens;

	return message;
};
