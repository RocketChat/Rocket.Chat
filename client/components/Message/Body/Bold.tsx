import { Bold as ASTBold } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Italic from './Italic';
import Strike from './Strike';

const Bold: FC<{ value: ASTBold['value'] }> = ({ value = [] }) => (
	<strong>
		{value.map((block, index) => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return block.value;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'ITALIC':
					return <Italic key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</strong>
);

export default Bold;
