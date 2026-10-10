import type * as MessageParser from '@rocket.chat/message-parser';

import Markup from '../Markup';
import InlineElements from '../elements/InlineElements';

export type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const UnorderedListBlock = ({ items }: UnorderedListBlockProps) => (
	<ul>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.nested && <Markup tokens={item.nested} />}
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
