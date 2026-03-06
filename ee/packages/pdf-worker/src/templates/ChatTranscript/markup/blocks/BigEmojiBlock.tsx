import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { toShort } from '../../../../emojiUtils';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps): ReactElement => (
	<Text>
		{emoji.map((emoji, index) => (
			<Text key={index}>{emoji.value ? `:${emoji.value?.value}:` : toShort(emoji.unicode)}</Text>
		))}
	</Text>
);

export default BigEmojiBlock;
