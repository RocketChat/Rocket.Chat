import { Base64 } from '@rocket.chat/base64';
import { isFileImageAttachment, isFileAttachment, isFileAudioAttachment, isFileVideoAttachment } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { parseMessageTextToAstMarkdown } from '../../../lib/parseMessageTextToAstMarkdown';
import { useAutoLinkDomains } from '../../../views/room/MessageList/hooks/useAutoLinkDomains';
import { useAutoTranslate } from '../../../views/room/MessageList/hooks/useAutoTranslate';
import { useKatex } from '../../../views/room/MessageList/hooks/useKatex';
import { useSubscriptionFromMessageQuery } from './useSubscriptionFromMessageQuery';

export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
	const { katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled } = useKatex();
	const customDomains = useAutoLinkDomains();
	const subscription = useSubscriptionFromMessageQuery(message).data ?? undefined;
	const autoTranslateOptions = useAutoTranslate(subscription);
	const showColors = useSetting<boolean>('HexColorPreview_Enabled');

	return useMemo(() => {
		const parseOptions: Options = {
			colors: showColors,
			emoticons: true,
			customDomains,
			...(katexEnabled && {
				katex: {
					dollarSyntax: katexDollarSyntaxEnabled,
					parenthesisSyntax: katexParenthesisSyntaxEnabled,
				},
			}),
		};

		const normalizedMessage = parseMessageTextToAstMarkdown(message, parseOptions, autoTranslateOptions);

		normalizedMessage.attachments = normalizedMessage.attachments?.map((attachment) => {
			if (!attachment.encryption) {
				return attachment;
			}

			const key = Base64.encode(
				JSON.stringify({
					...attachment.encryption,
					name: String.fromCharCode(...new TextEncoder().encode(normalizedMessage.file?.name)),
					type: normalizedMessage.file?.type,
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

		return normalizedMessage;
	}, [showColors, customDomains, katexEnabled, katexDollarSyntaxEnabled, katexParenthesisSyntaxEnabled, message, autoTranslateOptions]);
};
