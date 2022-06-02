import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const UnorderedListBlock = ({ items }: UnorderedListBlockProps): ReactElement => (
	<ul>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements children={item.value} />
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
