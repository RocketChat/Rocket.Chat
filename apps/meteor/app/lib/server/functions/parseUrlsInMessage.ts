import type { IMessage, AtLeast } from '@rocket.chat/core-typings';

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
	
	// Extract URLs from parsed message AST (message.md) - these have normalized schemas
	if (message.md) {
		const astUrls = extractUrlsFromMessageAST(message.md);
		urls.push(...astUrls);
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
