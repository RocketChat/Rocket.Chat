import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type ParagraphBlockProps = {
	items: MessageParser.Inlines[];
};

const ParagraphBlock = ({ items }: ParagraphBlockProps) => <InlineElements children={items} />;

export default ParagraphBlock;
