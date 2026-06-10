import type * as MessageParser from '@rocket.chat/message-parser';

import ParagraphBlock from './ParagraphBlock';

type QuoteBlockProps = {
	children: MessageParser.Paragraph[];
};

const QuoteBlock = ({ children }: QuoteBlockProps) => (
	<blockquote>
		{children.map((paragraph, index) => (
			<ParagraphBlock key={index}>{paragraph.value}</ParagraphBlock>
		))}
	</blockquote>
);

export default QuoteBlock;
