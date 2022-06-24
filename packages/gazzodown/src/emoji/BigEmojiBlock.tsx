import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import BigEmojiElement from './BigEmojiElement';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps): ReactElement => (
	<>
		{emoji.map((emoji, index) => (
			<BigEmojiElement key={index} {...emoji} />
		))}
	</>
);

export default BigEmojiBlock;
