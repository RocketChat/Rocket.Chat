import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps): ReactElement => (
	<ol>
		{items.map(({ value, number }, index) => (
			<li key={index} value={number}>
				<InlineElements children={value} />
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
