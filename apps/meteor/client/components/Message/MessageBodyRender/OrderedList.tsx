import { MessageOrderedList, MessageOrderedListItem } from '@rocket.chat/fuselage';
import { OrderedList as ASTOrderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const OrderedList: FC<{ value: ASTOrderedList['value'] }> = ({ value }) => (
	<MessageOrderedList>
		{value.map(({ value: { digit, text } }, index) => (
			<MessageOrderedListItem key={index} value={Number(digit)}>
				<Inline value={text} />
			</MessageOrderedListItem>
		))}
	</MessageOrderedList>
);

export default OrderedList;
