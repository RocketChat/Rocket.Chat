import type { IMessage, AtLeast } from '@rocket.chat/core-typings';

import { extractUrlsFromMessageAST } from './extractUrlsFromMessageAST';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';
import { Markdown } from '../../../markdown/server';
import { settings } from '../../../settings/server';

const prepareUrl = (url: string, previewUrls: string[] | undefined) => ({
	url,
	meta: {},
	...(previewUrls && !previewUrls.includes(url) && !url.includes(settings.get('Site_Url')) && { ignoreParse: true }),
});

const prepareUrls = (urls: string[], previewUrls?: string[]) => [...new Set(urls)].map((url) => prepareUrl(url, previewUrls));

export const parseUrlsInMessage = (
	message: AtLeast<IMessage, 'msg' | 'md'> & {
		parseUrls?: boolean;
	},
	previewUrls?: string[],
) => {
	// Also extract URLs from message blocks if they exist
	if (message.md) {
		const astUrls = extractUrlsFromMessageAST(message.md);
		return prepareUrls(astUrls, previewUrls);
	}

	// TODO: remove this after make the parser official
	// Parse the message to extract URLs from links without schema
	// The message parser converts links like "github.com" to proper links with "//" prefix
	const result = Markdown.code({
		html: message.msg,
		msg: message.msg,
	});
	const htmlUrls = result.html?.match(getMessageUrlRegex()) || [];
	return prepareUrls(htmlUrls, previewUrls);
};
