import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import {
	isFileImageAttachment,
	isFileAttachment,
	isFileAudioAttachment,
	isFileVideoAttachment,
	isQuoteAttachment,
} from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';

import { getDecryptedFileUrl } from './e2ee/getDecryptedFileUrl';
import type { MessageWithMdEnforced } from './parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown } from './parseMessageTextToAstMarkdown';
import type { AutoTranslateOptions } from '../views/room/MessageList/hooks/useAutoTranslate';

const normalizeAttachments = (attachments: MessageAttachment[], name?: string, type?: string): MessageAttachment[] => {
	return attachments.map((attachment) => {
		if (isQuoteAttachment(attachment) && attachment.attachments) {
			attachment.attachments = normalizeAttachments(attachment.attachments);
			return attachment;
		}

		if (!attachment.encryption) {
			return attachment;
		}

		const { encryption } = attachment;
		const decryptedUrl = (path: string) => getDecryptedFileUrl(path, { encryption, name, type });

		if (isFileAttachment(attachment)) {
			if (attachment.title_link && !attachment.title_link.startsWith('/file-decrypt/')) {
				attachment.title_link = decryptedUrl(attachment.title_link);
			}
			if (isFileImageAttachment(attachment) && !attachment.image_url.startsWith('/file-decrypt/')) {
				attachment.image_url = decryptedUrl(attachment.image_url);
			}
			if (isFileAudioAttachment(attachment) && !attachment.audio_url.startsWith('/file-decrypt/')) {
				attachment.audio_url = decryptedUrl(attachment.audio_url);
			}
			if (isFileVideoAttachment(attachment) && !attachment.video_url.startsWith('/file-decrypt/')) {
				attachment.video_url = decryptedUrl(attachment.video_url);
			}
		}

		return attachment;
	});
};

export const createMessageNormalizer =
	(parseOptions: Options, autoTranslateOptions: AutoTranslateOptions) =>
	<TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
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

export type MessageNormalizer = ReturnType<typeof createMessageNormalizer>;
