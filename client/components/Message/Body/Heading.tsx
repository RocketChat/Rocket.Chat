import { Bold as ASTHeading } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

const Heading: FC<{ value: ASTHeading['value'] }> = ({ value = [] }) => (
	<h1>
		{value.map((block) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return block.value;
				default:
					return null;
			}
		})}
	</h1>
);

export default Heading;
