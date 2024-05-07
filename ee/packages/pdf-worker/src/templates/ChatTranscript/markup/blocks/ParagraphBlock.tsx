import { View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type ParagraphBlockProps = {
	items: MessageParser.Inlines[];
};

const ParagraphBlock = ({ items }: ParagraphBlockProps) => (
	<View>
		<InlineElements children={items} />
	</View>
);

export default ParagraphBlock;
