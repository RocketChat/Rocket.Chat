import { MessageEmoji, ThreadMessageEmoji } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo, useContext, memo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
	preview?: boolean;
};

const Emoji = ({ big = false, preview = false, ...emoji }: EmojiProps): ReactElement => {
	const { detectEmoji } = useContext(MarkupInteractionContext);

	const descriptors = useMemo(() => {
		const whatToInspect = 'unicode' in emoji ? emoji.unicode : `:${emoji.shortCode}:`;
		const detected = detectEmoji?.(whatToInspect);
		return detected?.length !== 0 ? detected : undefined;
	}, [detectEmoji, emoji]);

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
			)) ?? <>:{emoji.value?.value}:</>}
		</>
	);
};

export default memo(Emoji);
