import type * as MessageParser from '@rocket.chat/message-parser';

import NestedListsBlock from './NestedListsBlock';
import InlineElements from '../elements/InlineElements';

export type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps) => (
	<ol>
		{items.map(({ value, number, nested }, index) => (
			<li key={index} value={number}>
				<InlineElements>{value}</InlineElements>
				{nested && <NestedListsBlock lists={nested} />}
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
