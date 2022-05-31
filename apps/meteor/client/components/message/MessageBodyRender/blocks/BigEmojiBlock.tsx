import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import MessageEmoji from '../../MessageEmoji';

type BigEmojiBlockProps = {
	emojis: MessageParser.Emoji[];
	isThreadPreview?: boolean;
};

const BigEmojiBlock = ({ emojis, isThreadPreview }: BigEmojiBlockProps): ReactElement => (
	<>
		{emojis.map(({ value: { value: handle } }, index) => (
			<MessageEmoji key={index} handle={handle} big isThreadPreview={isThreadPreview} />
		))}
	</>
);

export default BigEmojiBlock;
