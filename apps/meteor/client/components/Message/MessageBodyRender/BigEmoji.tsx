import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
	disableBigEmoji: boolean;
};

const BigEmoji: FC<BigEmojiProps> = ({ value, disableBigEmoji }) => (
	<>
		{value.map((block, index) => (
			<Emoji className={!disableBigEmoji ? 'big' : undefined} key={index} emojiHandle={`:${block.value.value}:`} />
		))}
	</>
);

export default BigEmoji;
