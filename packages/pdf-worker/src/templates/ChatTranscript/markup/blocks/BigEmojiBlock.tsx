import { Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import emojione from 'emojione';
import type { ReactElement } from 'react';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps): ReactElement => (
	<View>
		{emoji.map((emoji, index) => (
			<Text key={index}>{emoji.value !== undefined ? `:${emoji.value?.value}:` : emojione.toShort(emoji.unicode)}</Text>
		))}
	</View>
);

export default BigEmojiBlock;
