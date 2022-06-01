import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import Inline from '../Inline';

type UnorderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const UnorderedListBlock = ({ items }: UnorderedListBlockProps): ReactElement => (
	<ul>
		{items.map((item, index) => (
			<li key={index}>
				<Inline value={item.value} />
			</li>
		))}
	</ul>
);

export default UnorderedListBlock;
