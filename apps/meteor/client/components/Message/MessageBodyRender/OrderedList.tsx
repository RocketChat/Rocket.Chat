import { MessageOrderedList, MessageOrderedListItem } from '@rocket.chat/fuselage';
import { OrderedList as ASTOrderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const OrderedList: FC<{ value: ASTOrderedList['value'] }> = ({ value }) => (
	<MessageOrderedList>
		{value.map((item, index) => (
			<MessageOrderedListItem key={index}>
				<Inline value={item.value} />
			</MessageOrderedListItem>
		))}
	</MessageOrderedList>
);

export default OrderedList;
