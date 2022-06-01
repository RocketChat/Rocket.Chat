import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import Inline from '../Inline';

type OrderedListBlockProps = {
	items: MessageParser.ListItem[];
};

const OrderedListBlock = ({ items }: OrderedListBlockProps): ReactElement => (
	<ol>
		{items.map(({ value, number }, index) => (
			<li key={index} value={Number(number)}>
				<Inline value={value} />
			</li>
		))}
	</ol>
);

export default OrderedListBlock;
