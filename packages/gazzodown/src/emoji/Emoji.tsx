import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo, useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import PlainSpan from '../elements/PlainSpan';
import EmojiRenderer from './EmojiRenderer';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const Emoji = ({ big = false, preview = false, ...emoji }: EmojiProps): ReactElement => {
	const { convertAsciiToEmoji } = useContext(MarkupInteractionContext);

	const asciiEmoji = useMemo(
		() => ('shortCode' in emoji && emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined),
		[emoji],
	);

	if (!convertAsciiToEmoji && asciiEmoji) {
		return <PlainSpan text={asciiEmoji} />;
	}

	return <EmojiRenderer big={big} preview={preview} {...emoji} />;
};

export default memo(Emoji);
