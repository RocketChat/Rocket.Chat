import { OrderedList as ASTOrderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const OrderedList: FC<{ value: ASTOrderedList['value'] }> = ({ value }) => (
	<ol>
		{value.map(({ value, number }, index) => (
			<li key={index} value={Number(number)}>
				<Inline value={value} />
			</li>
		))}
	</ol>
);

export default OrderedList;
