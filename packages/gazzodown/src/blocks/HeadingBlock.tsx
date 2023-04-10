import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import PlainSpan from '../elements/PlainSpan';

type HeadingBlockProps = {
	children?: MessageParser.Plain[];
	level?: 1 | 2 | 3 | 4;
};

const HeadingBlock = ({ children = [], level = 1 }: HeadingBlockProps): ReactElement => {
	const HeadingTag = `h${level}` as const;

	return (
		<HeadingTag>
			{children.map((block, index) => (
				<PlainSpan key={index} text={block.value} />
			))}
		</HeadingTag>
	);
};

export default HeadingBlock;
