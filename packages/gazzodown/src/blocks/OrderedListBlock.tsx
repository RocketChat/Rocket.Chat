import type * as MessageParser from '@rocket.chat/message-parser';

import Markup from '../Markup';
import InlineElements from '../elements/InlineElements';

export type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<ol>
		{items.map(({ value, number, nested }, index) => (
			<li key={index} value={number}>
				<InlineElements>{value}</InlineElements>
				{nested && <Markup tokens={nested} />}
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
