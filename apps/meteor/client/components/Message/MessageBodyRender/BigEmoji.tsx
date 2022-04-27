import { Box } from '@rocket.chat/fuselage';
import { BigEmoji as ASTBigEmoji } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Emoji from '../../Emoji';

type BigEmojiProps = {
	value: ASTBigEmoji['value'];
	disableBigEmoji: boolean;
};

const emojiStyle = { width: '100%', height: '100%' };

// TODO ENGINEERING DAY:
// Create new parser renderer for threadPreview instead of
// disabling big emoji via disableBigEmoji prop
const BigEmoji: FC<BigEmojiProps> = ({ value, disableBigEmoji }) => (
	<>
		{disableBigEmoji
			? value.map((block, index) => <Emoji key={index} emojiHandle={`:${block.value.value}:`} />)
			: value.map((block, index) => (
					<Box size='x44' key={index}>
						<Emoji emojiHandle={`:${block.value.value}:`} style={emojiStyle} />
					</Box>
			  ))}
	</>
);

export default BigEmoji;
