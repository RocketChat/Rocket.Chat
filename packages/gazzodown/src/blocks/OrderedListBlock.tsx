import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<ol>
		{items.map(({ value, number }, index) => (
			<li key={index} value={number}>
				<InlineElements>{value}</InlineElements>
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
