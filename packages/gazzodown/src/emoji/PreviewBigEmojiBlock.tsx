import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import PreviewEmojiElement from './PreviewEmojiElement';

type PreviewBigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
};

const PreviewBigEmojiBlock = ({ emoji }: PreviewBigEmojiBlockProps): ReactElement => (
	<>
		{emoji.map((emoji, index) => (
			<PreviewEmojiElement key={index} {...emoji} />
		))}
	</>
);

export default PreviewBigEmojiBlock;
