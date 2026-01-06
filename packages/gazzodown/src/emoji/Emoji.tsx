import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo, useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import EmojiRenderer from './EmojiRenderer';
import PlainSpan from '../elements/PlainSpan';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const Emoji = ({ big = false, preview = false, ...emoji }: EmojiProps): ReactElement => {
	const { convertAsciiToEmoji, useEmoji } = useContext(MarkupInteractionContext);

	const asciiEmoji = useMemo(() => {
		try {
			// Defensive checks for potentially undefined properties
			if ('shortCode' in emoji && emoji.value && typeof emoji.value === 'object' && 'value' in emoji.value) {
				const { value: emojiValue } = emoji.value;
				const { shortCode } = emoji;

				// Only treat as different if both exist and are strings
				if (typeof emojiValue === 'string' && typeof shortCode === 'string' && emojiValue !== shortCode) {
					return emojiValue;
				}
			}
			return undefined;
		} catch (error) {
			console.error('Error computing ascii emoji:', error);
			return undefined;
		}
	}, [emoji]);

	if (!useEmoji && 'shortCode' in emoji) {
		try {
			// Safely extract shortCode and value with fallbacks
			const shortCode = typeof emoji.shortCode === 'string' ? emoji.shortCode : '[deleted-emoji]';
			const valueStr =
				emoji.value && typeof emoji.value === 'object' && 'value' in emoji.value && typeof emoji.value.value === 'string'
					? emoji.value.value
					: shortCode;

			const displayText = shortCode === valueStr ? `:${shortCode}:` : valueStr;
			return <PlainSpan text={displayText} />;
		} catch (error) {
			console.error('Error rendering shortCode emoji:', error);
			return <PlainSpan text=":emoji:" />;
		}
	}

	if (!convertAsciiToEmoji && asciiEmoji) {
		return <PlainSpan text={asciiEmoji} />;
	}

	return <EmojiRenderer big={big} preview={preview} {...emoji} />;
};

export default memo(Emoji);
