import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

export type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<ol>
		{items.map(({ value, number, indentLevel }, index) => (
			<li key={index} value={number} style={indentLevel ? { marginInlineStart: `${indentLevel * 0.5}rem` } : undefined}>
				<InlineElements>{value}</InlineElements>
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
