import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import joypixels from 'emoji-toolkit';
import type { ReactElement } from 'react';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps): ReactElement => (
	<Text>
		{emoji.map((emoji, index) => (
			<Text key={index}>{emoji.value ? `:${emoji.value?.value}:` : joypixels.toShort(emoji.unicode)}</Text>
		))}
	</Text>
);

export default BigEmojiBlock;
