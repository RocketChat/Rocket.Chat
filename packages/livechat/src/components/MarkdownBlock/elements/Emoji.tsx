import type * as MessageParser from '@rocket.chat/message-parser';
import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';

import EmojiRenderer from './EmojiRenderer';
import PlainSpan from './PlainSpan';

export type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
};

const Emoji = ({ big = false, ...emoji }: EmojiProps) => {
	const asciiEmoji = useMemo(
		() => ('shortCode' in emoji && emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined),
		[emoji],
	);

	if ('shortCode' in emoji) {
		return <PlainSpan text={emoji.shortCode === emoji.value.value ? `:${emoji.shortCode}:` : emoji.value.value} />;
	}

	if (asciiEmoji) {
		return <PlainSpan text={asciiEmoji} />;
	}

	return <EmojiRenderer big={big} {...emoji} />;
};

export default memo(Emoji);
