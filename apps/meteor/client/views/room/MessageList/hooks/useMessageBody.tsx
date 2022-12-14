import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { parseMessageTextToAstMarkdown } from '../lib/parseMessageTextToAstMarkdown';
import { useAutoTranslate } from './useAutoTranslate';

export const useMessageBody = (
	parentMessage: UseQueryResult<IMessage, unknown>,
	subscription: ISubscription | undefined,
): string | Root => {
	const { isSuccess, data: message } = parentMessage;

	const autoTranslateOptions = useAutoTranslate(subscription);
	return useMemo(() => {
		if (!isSuccess || !message) {
			return '';
		}

		if (message.md) {
			const parseOptions: Options = {
				emoticons: true,
			};

			const messageWithMd = parseMessageTextToAstMarkdown(message, parseOptions, autoTranslateOptions);

			return messageWithMd.md;
		}

		if (message.msg) {
			return message.msg;
		}

		if (message.attachments) {
			const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

			if (attachment?.description) {
				return attachment.description;
			}

			if (attachment?.title) {
				return attachment.title;
			}
		}

		return '';
	}, [parentMessage]);
};
