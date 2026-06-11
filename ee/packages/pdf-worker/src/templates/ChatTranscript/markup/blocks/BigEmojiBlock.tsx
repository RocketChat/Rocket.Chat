import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import emojione from 'emoji-toolkit';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps) => (
	<Text>
		{emoji.map((emoji, index) => (
			<Text key={index}>{emoji.value ? `:${emoji.value?.value}:` : emojione.toShort(emoji.unicode)}</Text>
		))}
	</Text>
);

export default BigEmojiBlock;
