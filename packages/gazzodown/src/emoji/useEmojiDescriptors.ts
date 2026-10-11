import type * as MessageParser from '@rocket.chat/message-parser';
import DOMPurify from 'dompurify';
import { useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

export const useEmojiDescriptors = (emoji: MessageParser.Emoji) => {
	const { detectEmoji } = useContext(MarkupInteractionContext);

	const fallback = useMemo(() => ('unicode' in emoji ? emoji.unicode : `:${emoji.shortCode ?? emoji.value.value}:`), [emoji]);

	const sanitizedFallback = useMemo(() => DOMPurify.sanitize(fallback), [fallback]);

	const descriptors = useMemo(() => {
		const detected = detectEmoji?.(sanitizedFallback);
		return detected?.length !== 0 ? detected : undefined;
	}, [detectEmoji, sanitizedFallback]);

	return { descriptors, sanitizedFallback };
};
