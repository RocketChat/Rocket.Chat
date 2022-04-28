import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
};

const BigEmoji: FC<BigEmojiProps> = ({ value }) => (
	<>
		{value.map((block, index) => (
			<Emoji emojiHandle={`:${block.value.value}:`} className='big' key={index} />
		))}
	</>
);

export default BigEmoji;
