import { Heading as ASTHeading } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import PlainText from '../PlainText';

const ThreadPreviewHeading: FC<{ value: ASTHeading['value'] }> = ({ value = [] }) => (
	<b>
		{' '}
		{value.map((block, index) => (
			<PlainText key={index} value={block.value} />
		))}
	</b>
);

export default ThreadPreviewHeading;
