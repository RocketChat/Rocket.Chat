import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import EmojiElement from '../elements/EmojiElement';

type PreviewBigEmojiBlockProps = {
	emojis: MessageParser.Emoji[];
};

const PreviewBigEmojiBlock = ({ emojis }: PreviewBigEmojiBlockProps): ReactElement => (
	<>
		{emojis.map((emoji, index) => (
			<EmojiElement key={index} handle={emoji.value.value} />
		))}
	</>
);

export default PreviewBigEmojiBlock;
