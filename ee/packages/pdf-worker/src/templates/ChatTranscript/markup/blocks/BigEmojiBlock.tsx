import { Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { unicodeToShortname } from '../emoji';

export type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
	separators?: MessageParser.BigEmoji['separators'];
};

const BigEmojiBlock = ({ emoji, separators }: BigEmojiBlockProps): ReactElement => (
	<Text>
		{emoji.map((emoji, index) => (
			<Text key={index}>
				{separators?.[index - 1]?.replace(/\r\n|\r/g, '\n')}
				{emoji.value ? `:${emoji.value?.value}:` : unicodeToShortname(emoji.unicode)}
			</Text>
		))}
	</Text>
);

export default BigEmojiBlock;
