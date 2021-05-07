import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
};

const BigEmoji: FC<BigEmojiProps> = ({ value }) => (
	<strong>
		{value.map((block, index) => (
			<Emoji className='big' key={index} emojiHandle={`:${block.value.value}:`} />
		))}
	</strong>
);

export default BigEmoji;
