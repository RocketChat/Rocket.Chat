import type { IMessage, AtLeast } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';
import { Markdown } from '../../../markdown/server';
import { settings } from '../../../settings/server';
import { extractTextFromBlocks, extractUrlsFromMessageAST } from './extractTextFromBlocks';

// TODO move this function to message service to be used like a "beforeSaveMessage" hook
export const parseUrlsInMessage = (message: AtLeast<IMessage, 'msg'> & { parseUrls?: boolean }, previewUrls?: string[]) => {
	if (message.parseUrls === false) {
		return message;
	}

	message.html = message.msg;
	message = Markdown.code(message);

	const urls = message.html?.match(getMessageUrlRegex()) || [];
	
	// Parse the message to extract URLs from links without schema
	// The message parser converts links like "github.com" to proper links with "//" prefix
	if (message.msg) {
		try {
			const customDomains = settings.get<string>('Message_CustomDomain_AutoLink')
				? settings
						.get<string>('Message_CustomDomain_AutoLink')
						.split(',')
						.map((domain) => domain.trim())
				: [];
			
			const parsedMessage = parse(message.msg, { customDomains });
			const astUrls = extractUrlsFromMessageAST(parsedMessage);
			urls.push(...astUrls);
		} catch (e) {
			// If parsing fails, just continue with URLs from regex
		}
	}
	
	// Also extract URLs from message blocks if they exist
	if (message.blocks) {
		const blockTexts = extractTextFromBlocks(message.blocks);
		const blockUrls = blockTexts.flatMap((text) => text.match(getMessageUrlRegex()) || []);
		urls.push(...blockUrls);
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
