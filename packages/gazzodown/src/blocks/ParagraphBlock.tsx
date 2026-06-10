import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type ParagraphBlockProps = {
	children: MessageParser.Inlines[];
};

const ParagraphBlock = ({ children }: ParagraphBlockProps) => (
	<div>
		<InlineElements>{children}</InlineElements>
	</div>
);

export default ParagraphBlock;
