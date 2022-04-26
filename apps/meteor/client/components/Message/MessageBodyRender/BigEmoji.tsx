import { css } from '@rocket.chat/css-in-js';
import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
	disableBigEmoji: boolean;
};

const BigEmoji: FC<BigEmojiProps> = ({ value, disableBigEmoji }) => {
	const bigEmojiClass = css`
		> span {
			width: ${disableBigEmoji ? '1em' : '44px'};
			height: ${disableBigEmoji ? '1em' : '44px'};
		}
	`;

	return (
		<>
			{value.map((block, index) => (
				<Emoji className={bigEmojiClass} key={index} emojiHandle={`:${block.value.value}:`} />
			))}
		</>
	);
};

export default BigEmoji;
