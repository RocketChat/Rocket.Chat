import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';

import { ComposerMarkupContext } from './ComposerMarkupContext';

type ComposerEmojiElementProps = MessageParser.Emoji & {
	big?: boolean;
};

const ComposerEmojiElement = ({ big = false, ...emoji }: ComposerEmojiElementProps): ReactElement => {
	const { convertAsciiToEmoji, useEmoji, detectEmoji } = useContext(ComposerMarkupContext);

	const asciiEmoji = useMemo(
		() => ('shortCode' in emoji && emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined),
		[emoji],
	);

	if (!useEmoji && 'shortCode' in emoji) {
		return <>{emoji.shortCode === emoji.value.value ? `:${emoji.shortCode}:` : emoji.value.value}</>;
	}

	if (!convertAsciiToEmoji && asciiEmoji) {
		return <>{asciiEmoji}</>;
	}

	const fallback = 'unicode' in emoji ? emoji.unicode : `:${('shortCode' in emoji && emoji.shortCode) || ''}:`;

	const descriptors = detectEmoji?.(fallback);
	if (descriptors && descriptors.length > 0) {
		return (
			<>
				{descriptors.map(({ name, className, image, content }, i) => (
					<span key={i} title={name} className={className} style={image ? { backgroundImage: `url(${image})` } : undefined}>
						{content}
					</span>
				))}
			</>
		);
	}

	return (
		<span role='img' aria-label={fallback} style={big ? { fontSize: '2em' } : undefined}>
			{fallback}
		</span>
	);
};

export default memo(ComposerEmojiElement);
