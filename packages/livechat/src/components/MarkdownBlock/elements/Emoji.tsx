import type * as MessageParser from '@rocket.chat/message-parser';
import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';

import EmojiRenderer from './EmojiRenderer';
import PlainSpan from './PlainSpan';

export type EmojiProps = MessageParser.Emoji;

const Emoji = (emoji: EmojiProps) => {
	const asciiEmoji = useMemo(
		() => ('shortCode' in emoji && emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined),
		[emoji],
	);

	if (asciiEmoji) {
		return <PlainSpan text={asciiEmoji} />;
	}

	return <EmojiRenderer {...emoji} />;
};

export default memo(Emoji);
