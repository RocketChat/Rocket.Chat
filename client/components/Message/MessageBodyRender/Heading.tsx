import { Bold as ASTHeading } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import PlainText from './PlainText';

const Heading: FC<{ value: ASTHeading['value'] }> = ({ value = [] }) => (
	<h1>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <PlainText key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</h1>
);

export default Heading;
