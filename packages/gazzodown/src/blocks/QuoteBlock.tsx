import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ParagraphBlock from './ParagraphBlock';

type QuoteBlockProps = {
	children: MessageParser.Paragraph[];
};

const QuoteBlock = ({ children }: QuoteBlockProps): ReactElement => (
	<blockquote>
		{children.map((paragraph, index) => (
			<ParagraphBlock key={index} children={paragraph.value} />
		))}
	</blockquote>
);

export default QuoteBlock;
