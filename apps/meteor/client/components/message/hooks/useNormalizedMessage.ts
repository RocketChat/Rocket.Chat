import { Base64 } from '@rocket.chat/base64';
import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import {
	isFileImageAttachment,
	isFileAttachment,
	isFileAudioAttachment,
	isFileVideoAttachment,
	isQuoteAttachment,
} from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown } from '../../../lib/parseMessageTextToAstMarkdown';
import { useAutoLinkDomains } from '../../../views/room/MessageList/hooks/useAutoLinkDomains';
import { useMessageListAutoTranslate, useMessageListKatex, useMessageListShowColors } from '../list/MessageListContext';

const normalizeAttachments = (attachments: MessageAttachment[], name?: string, type?: string): MessageAttachment[] => {
	if (name) {
		name = String.fromCharCode(...new TextEncoder().encode(name));
	}

	return attachments.map((attachment) => {
		if (isQuoteAttachment(attachment) && attachment.attachments) {
			attachment.attachments = normalizeAttachments(attachment.attachments);
			return attachment;
		}

		if (!attachment.encryption) {
			return attachment;
		}

		const key = Base64.encode(
			JSON.stringify({
				...attachment.encryption,
				name,
				type,
			}),
		);

		if (isFileAttachment(attachment)) {
			if (attachment.title_link && !attachment.title_link.startsWith('/file-decrypt/')) {
				attachment.title_link = `/file-decrypt${attachment.title_link}?key=${key}`;
			}
			if (isFileImageAttachment(attachment) && !attachment.image_url.startsWith('/file-decrypt/')) {
				attachment.image_url = `/file-decrypt${attachment.image_url}?key=${key}`;
			}
			if (isFileAudioAttachment(attachment) && !attachment.audio_url.startsWith('/file-decrypt/')) {
				attachment.audio_url = `/file-decrypt${attachment.audio_url}?key=${key}`;
			}
			if (isFileVideoAttachment(attachment) && !attachment.video_url.startsWith('/file-decrypt/')) {
				attachment.video_url = `/file-decrypt${attachment.video_url}?key=${key}`;
			}
		}

		return attachment;
	});
};

export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
	const katex = useMessageListKatex();
	const katexEnabled = !!katex;
	const customDomains = useAutoLinkDomains();
	const autoTranslateOptions = useMessageListAutoTranslate();
	const showColors = useMessageListShowColors();

	return useMemo(() => {
		const parseOptions: Options = {
			colors: showColors,
			emoticons: true,
			customDomains,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katex.dollarSyntaxEnabled,
					parenthesisSyntax: katex.parenthesisSyntaxEnabled,
				},
			}),
		};

		const normalizedMessage = parseMessageTextToAstMarkdown(message, parseOptions, autoTranslateOptions);

		if (normalizedMessage.attachments) {
			normalizedMessage.attachments = normalizeAttachments(
				normalizedMessage.attachments,
				normalizedMessage.file?.name,
				normalizedMessage.file?.type,
			);
		}

		return normalizedMessage;
	}, [showColors, customDomains, katexEnabled, katex?.dollarSyntaxEnabled, katex?.parenthesisSyntaxEnabled, message, autoTranslateOptions]);
};
