import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type HeadingBlockProps = {
	children?: MessageParser.Inlines[];
	level?: 1 | 2 | 3 | 4;
};

const HeadingBlock = ({ children = [], level = 1 }: HeadingBlockProps) => {
	const HeadingTag = `h${level}` as const;

	return (
		<HeadingTag>
			<InlineElements>{children}</InlineElements>
		</HeadingTag>
	);
};

export default HeadingBlock;
