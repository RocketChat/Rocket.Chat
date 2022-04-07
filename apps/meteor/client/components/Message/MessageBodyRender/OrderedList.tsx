import { OrderedList as ASTOrderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const OrderedList: FC<{ value: ASTOrderedList['value'] }> = ({ value }) => (
	<ol>
		{value.map((item, index) => (
			<li key={index}>
				<Inline value={item.value} />
			</li>
		))}
	</ol>
);

export default OrderedList;
