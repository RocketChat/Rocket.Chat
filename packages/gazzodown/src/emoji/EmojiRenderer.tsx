import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo, useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const EmojiRenderer = ({ big = false, preview = false, ...emoji }: EmojiProps): ReactElement => {
	const { detectEmoji } = useContext(MarkupInteractionContext);

	const fallback = useMemo(() => ('unicode' in emoji ? emoji.unicode : `:${emoji.shortCode ?? emoji.value.value}:`), [emoji]);

	const descriptors = useMemo(() => {
		const detected = detectEmoji?.(fallback);
		return detected?.length !== 0 ? detected : undefined;
	}, [detectEmoji, fallback]);

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
				<span role='img' aria-label={fallback.charAt(0) === ':' ? fallback : undefined}>
					{fallback}
				</span>
			)}
		</>
	);
};

export default memo(EmojiRenderer);
