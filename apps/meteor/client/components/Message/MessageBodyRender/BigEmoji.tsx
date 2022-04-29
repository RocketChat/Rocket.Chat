import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import MessageEmoji from '../MessageEmoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
	isThreadPreview?: boolean;
};

const BigEmoji: FC<BigEmojiProps> = ({ value, isThreadPreview }) => (
	<>
		{value.map((block, index) => (
			<MessageEmoji isThreadPreview={isThreadPreview} big emojiHandle={`:${block.value.value}:`} key={index} />
		))}
	</>
);

export default BigEmoji;
