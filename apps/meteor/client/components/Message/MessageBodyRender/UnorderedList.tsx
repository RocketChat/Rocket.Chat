import { UnorderedList as ASTUnorderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const UnorderedList: FC<{ value: ASTUnorderedList['value'] }> = ({ value }) => (
	<ul>
		{value.map((item, index) => (
			<li key={index}>
				<Inline value={item.value} />
			</li>
		))}
	</ul>
);

export default UnorderedList;
