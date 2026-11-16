import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import type { Options } from '@rocket.chat/message-parser';
import type { MessageContentContextValue, MessageDisplayContextValue, NormalizedMessage } from '@rocket.chat/ui-message-list';
import { useMemo } from 'react';

import { normalizeMessage } from './normalizeMessage';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import { getEmojiClassNameAndDataTitle } from '../../lib/utils/renderEmoji';

const getEmojiData = (name: string) => {
	const { name: emojiName, className, image, children } = getEmojiClassNameAndDataTitle(name);
	return { name: emojiName, className, image, content: children };
};

/** Turns messages into what is displayed, with the viewer's parsing options and the conversation's translations. */
export const useMessageContentValue = (
	{ showColors, autoLinkDomains, katex }: MessageDisplayContextValue,
	subscription: ISubscription | undefined,
): MessageContentContextValue => {
	const autoTranslateOptions = useAutoTranslate(subscription);

	const parseOptions = useMemo<Options>(
		() => ({
			colors: showColors,
			emoticons: true,
			customDomains: autoLinkDomains ? autoLinkDomains.split(',').map((domain) => domain.trim()) : [],
			...(katex && { katex: { dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled } }),
		}),
		[showColors, autoLinkDomains, katex],
	);

	return useMemo(() => {
		// Each message object is normalized once for the current options.
		const normalized = new WeakMap<IMessage, ReturnType<typeof normalizeMessage>>();

		return {
			useNormalizedMessage: <TMessage extends IMessage>(message: TMessage) => {
				const cached = normalized.get(message) ?? normalizeMessage(message, parseOptions, autoTranslateOptions);
				normalized.set(message, cached);
				return cached as unknown as NormalizedMessage<TMessage>;
			},
			getEmojiData,
		};
	}, [parseOptions, autoTranslateOptions]);
};
