import type * as MessageParser from '@rocket.chat/message-parser';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
};

const EmojiRenderer = (props: EmojiProps) => {
	const fallback = 'unicode' in props ? props.unicode : `:${props.shortCode ?? props.value.value}:`;

	return (
		<>
			<span title={fallback} role='img' aria-label={fallback.charAt(0) === ':' ? fallback : undefined}>
				{fallback}
			</span>
		</>
	);
};

export default EmojiRenderer;
