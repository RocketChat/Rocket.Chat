import type * as MessageParser from '@rocket.chat/message-parser';

import BigEmojiElement from './BigEmojiElement';

type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emoji }: BigEmojiBlockProps) => (
	<div role='presentation'>
		{emoji.map((emoji, index) => (
			<BigEmojiElement key={index} {...emoji} />
		))}
	</div>
);

export default BigEmojiBlock;
