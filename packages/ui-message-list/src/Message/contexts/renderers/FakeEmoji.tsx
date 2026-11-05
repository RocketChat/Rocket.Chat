import type { MessageEmojiProps } from '../MessageRenderersContext';

const FakeEmoji = ({ emojiHandle, className }: MessageEmojiProps) => (
	<span className={className} title={emojiHandle}>
		{emojiHandle}
	</span>
);

export default FakeEmoji;
