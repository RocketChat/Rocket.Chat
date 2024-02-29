import type { IMessage } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { useUserSubscription, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { parseMessageTextToAstMarkdown } from '../../../../lib/parseMessageTextToAstMarkdown';
import { useAutoLinkDomains } from './useAutoLinkDomains';
import { useAutoTranslate } from './useAutoTranslate';

export const useMessageBody = (message: IMessage | undefined, rid: string): string | Root => {
	const subscription = useUserSubscription(rid);
	const autoTranslateOptions = useAutoTranslate(subscription);
	const customDomains = useAutoLinkDomains();
	const ignoreMarkdownCache = useSetting<boolean>('Troubleshoot_Disable_Markdown_Cache_Use');

	return useMemo(() => {
		if (!message) {
			return '';
		}

		if (message.md) {
			const parseOptions: Options = {
				customDomains,
				emoticons: true,
			};

			const messageWithMd = parseMessageTextToAstMarkdown(
				{ ...message, md: ignoreMarkdownCache ? undefined : message.md },
				parseOptions,
				autoTranslateOptions,
			);

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
	}, [message, customDomains, autoTranslateOptions]);
};
