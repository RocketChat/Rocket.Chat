import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const renderChildren = (children: MessageParser.ListItem[]): ReactElement => (
	<ul style={{ paddingInlineStart: '1.5rem' }}>
		{children.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length ? renderChildren(item.children) : null}
			</li>
		))}
	</ul>
);

const UnorderedListBlock = ({ items }: UnorderedListBlockProps): ReactElement => (
	<ul style={{ paddingInlineStart: '1.5rem' }}>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length ? renderChildren(item.children) : null}
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
