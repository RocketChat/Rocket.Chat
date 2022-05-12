import { MessageUnorderedList, MessageUnorderedListItem } from '@rocket.chat/fuselage';
import { UnorderedList as ASTUnorderedList } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const UnorderedList: FC<{ value: ASTUnorderedList['value'] }> = ({ value }) => (
	<MessageUnorderedList>
		{value.map((item, index) => (
			<MessageUnorderedListItem key={index}>
				<Inline value={item.value} />
			</MessageUnorderedListItem>
		))}
	</MessageUnorderedList>
);

export default UnorderedList;
