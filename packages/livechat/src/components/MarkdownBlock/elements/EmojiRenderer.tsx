import type * as MessageParser from '@rocket.chat/message-parser';
import DOMPurify from 'dompurify';
import { useMemo } from 'preact/hooks';

type EmojiProps = MessageParser.Emoji & {
	big?: boolean;
};

const EmojiRenderer = (props: EmojiProps) => {
	const fallback = useMemo(() => ('unicode' in props ? props.unicode : `:${props.shortCode ?? props.value.value}:`), [props]);

	const sanitizedFallback = DOMPurify.sanitize(fallback);

	return (
		<>
			<span title={sanitizedFallback} role='img' aria-label={sanitizedFallback.charAt(0) === ':' ? sanitizedFallback : undefined}>
				{sanitizedFallback}
			</span>
		</>
	);
};

export default EmojiRenderer;
