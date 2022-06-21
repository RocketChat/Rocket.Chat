import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import PreviewEmojiElement from '../elements/PreviewEmojiElement';

type PreviewBigEmojiBlockProps = {
	emojis: MessageParser.Emoji[];
};

const PreviewBigEmojiBlock = ({ emojis }: PreviewBigEmojiBlockProps): ReactElement => (
	<>
		{emojis.map((emoji, index) => (
			<PreviewEmojiElement key={index} handle={emoji.value.value} />
		))}
	</>
);

export default PreviewBigEmojiBlock;
