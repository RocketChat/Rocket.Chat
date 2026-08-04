import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import { useEmojiDescriptors } from './useEmojiDescriptors';
import PlainSpan from '../elements/PlainSpan';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const EmojiRenderer = ({ big = false, preview = false, ...emoji }: EmojiProps) => {
	const { useEmoji } = useContext(MarkupInteractionContext);

	const { descriptors, sanitizedFallback } = useEmojiDescriptors(emoji);

	//handles unicode emojis
	if (!useEmoji) {
		return <PlainSpan text={descriptors?.map(({ name, content }) => name || content).join('') ?? sanitizedFallback} />;
	}

	return (
		<>
			{descriptors?.map(({ name, className, image, content }, i) => (
				<span key={i} title={name}>
					{preview ? (
						<ThreadMessageEmoji className={className} name={name} image={image}>
							{content}
						</ThreadMessageEmoji>
					) : (
						<MessageEmoji big={big} className={className} name={name} image={image}>
							{content}
						</MessageEmoji>
					)}
				</span>
			)) ?? (
				<span title={sanitizedFallback} role='img' aria-label={sanitizedFallback.charAt(0) === ':' ? sanitizedFallback : undefined}>
					{sanitizedFallback}
				</span>
			)}
		</>
	);
};

export default memo(EmojiRenderer);
