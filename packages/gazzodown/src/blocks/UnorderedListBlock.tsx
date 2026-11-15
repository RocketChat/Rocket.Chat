import type * as MessageParser from '@rocket.chat/message-parser';

import NestedListsBlock from './NestedListsBlock';
import InlineElements from '../elements/InlineElements';

export type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const UnorderedListBlock = ({ items }: UnorderedListBlockProps) => (
	<ul>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.nested && <NestedListsBlock lists={item.nested} />}
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
