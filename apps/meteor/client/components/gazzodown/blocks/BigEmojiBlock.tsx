import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import BigEmojiElement from '../elements/BigEmojiElement';

type BigEmojiBlockProps = {
	emojis: MessageParser.Emoji[];
};

const BigEmojiBlock = ({ emojis }: BigEmojiBlockProps): ReactElement => (
	<>
		{emojis.map((emoji, index) => (
			<BigEmojiElement key={index} handle={emoji.value.value} />
		))}
	</>
);

export default BigEmojiBlock;
