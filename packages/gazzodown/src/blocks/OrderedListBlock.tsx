import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
	nested?: boolean;
};

const nestedListStyle = {
	paddingInlineStart: '1.5rem',
} as const;

const OrderedListBlock = ({ items, nested = false }: OrderedListBlockProps): ReactElement => (
	<ol style={nested ? nestedListStyle : undefined}>
		{items.map(({ value, number, children }, index) => (
			<li key={index} value={number}>
				<InlineElements>{value}</InlineElements>
				{children?.length && <OrderedListBlock items={children} nested />}
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
