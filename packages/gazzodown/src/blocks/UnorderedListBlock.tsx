import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
	nested?: boolean;
};

const nestedListStyle = {
	paddingInlineStart: '1.5rem',
} as const;

const UnorderedListBlock = ({ items, nested = false }: UnorderedListBlockProps): ReactElement => (
	<ul style={nested ? nestedListStyle : undefined}>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length && <UnorderedListBlock items={item.children} nested />}
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
