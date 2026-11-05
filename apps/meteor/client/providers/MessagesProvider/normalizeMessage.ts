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

import type { AutoTranslateOptions } from '../../hooks/useAutoTranslate';
import type { MessageWithMdEnforced } from '../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown } from '../../lib/parseMessageTextToAstMarkdown';

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
				attachment.title_link = `/file-decrypt${attachment.title_link}?key=${encodeURIComponent(key)}`;
			}
			if (isFileImageAttachment(attachment) && !attachment.image_url.startsWith('/file-decrypt/')) {
				attachment.image_url = `/file-decrypt${attachment.image_url}?key=${encodeURIComponent(key)}`;
			}
			if (isFileAudioAttachment(attachment) && !attachment.audio_url.startsWith('/file-decrypt/')) {
				attachment.audio_url = `/file-decrypt${attachment.audio_url}?key=${encodeURIComponent(key)}`;
			}
			if (isFileVideoAttachment(attachment) && !attachment.video_url.startsWith('/file-decrypt/')) {
				attachment.video_url = `/file-decrypt${attachment.video_url}?key=${encodeURIComponent(key)}`;
			}
		}

		return attachment;
	});
};

/** A message as it is displayed: its markdown parsed, its translation applied and its encrypted files served decrypted. */
export const normalizeMessage = <TMessage extends IMessage>(
	message: TMessage,
	parseOptions: Options,
	autoTranslateOptions: AutoTranslateOptions,
): MessageWithMdEnforced => {
	const normalizedMessage = parseMessageTextToAstMarkdown(message, parseOptions, autoTranslateOptions);

	if (normalizedMessage.attachments) {
		normalizedMessage.attachments = normalizeAttachments(
			normalizedMessage.attachments,
			normalizedMessage.file?.name,
			normalizedMessage.file?.type,
		);
	}

	return normalizedMessage;
};
