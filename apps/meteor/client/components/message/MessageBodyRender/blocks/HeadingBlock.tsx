import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import PlainText from '../PlainText';

type HeadingBlockProps = {
	chunks?: MessageParser.Plain[];
	level?: 1 | 2 | 3 | 4;
};

const HeadingBlock = ({ chunks = [], level = 1 }: HeadingBlockProps): ReactElement => {
	const HeadingTag = `h${level}` as const;

	return (
		<HeadingTag>
			{chunks.map((block, index) => (
				<PlainText key={index} value={block.value} />
			))}
		</HeadingTag>
	);
};

export default HeadingBlock;
