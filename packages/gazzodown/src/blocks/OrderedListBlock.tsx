import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const renderChildren = (children: MessageParser.ListItem[]): ReactElement => (
	<ol style={{ paddingInlineStart: '1.5rem' }}>
		{children.map((item, index) => (
			<li key={index} value={item.number}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length ? renderChildren(item.children) : null}
			</li>
		))}
	</ol>
);

const OrderedListBlock = ({ items }: OrderedListBlockProps): ReactElement => (
	<ol style={{ paddingInlineStart: '1.5rem' }}>
		{items.map((item, index) => (
			<li key={index} value={item.number}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length ? renderChildren(item.children) : null}
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
