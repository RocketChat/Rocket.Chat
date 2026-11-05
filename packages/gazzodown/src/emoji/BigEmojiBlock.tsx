import type * as MessageParser from '@rocket.chat/message-parser';
import { Fragment } from 'react';

import BigEmojiElement from './BigEmojiElement';

export type BigEmojiBlockProps = {
	emoji: MessageParser.Emoji[];
	separators?: MessageParser.BigEmoji['separators'];
};

const BigEmojiBlock = ({ emoji, separators }: BigEmojiBlockProps) => (
	<div role='presentation'>
		{emoji.map((emoji, index) => (
			<Fragment key={index}>
				{separators?.[index - 1]?.match(/\r\n|\r|\n/g)?.map((_lineBreak, breakIndex) => (
					<br key={breakIndex} />
				))}
				<BigEmojiElement {...emoji} />
			</Fragment>
		))}
	</div>
);

export default BigEmojiBlock;
