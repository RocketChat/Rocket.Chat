import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

const BigEmoji: FC<{ value: ASTBigEmoji['value'] }> = ({ value = [] }) => (
	<strong>
		{value.map((block, index) => (
			<Emoji className='big' key={index} emojiHandle={`:${block.value.value}:`} />
		))}
	</strong>
);

export default BigEmoji;
