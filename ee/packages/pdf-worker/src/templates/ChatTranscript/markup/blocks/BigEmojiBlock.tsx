import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps) => (
	<Text>
		{emoji.map((emoji, index) => (
			<Text key={index}>{emoji.value ? `:${emoji.value?.value}:` : emoji.unicode}</Text>
		))}
	</Text>
);

export default BigEmojiBlock;
