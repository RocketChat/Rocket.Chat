import { Italic as ASTItalic } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Bold from './Bold';
import Link from './Link';
import PlainText from './PlainText';
import Strike from './Strike';

const Italic: FC<{ value: ASTItalic['value'] }> = ({ value = [] }) => (
	<i>
		{value.map((block, index) => {
			switch (block.type) {
				case 'LINK':
					return <Link key={index} value={block.value} />;
				case 'PLAIN_TEXT':
					return <PlainText key={index} value={block.value} />;
				case 'STRIKE':
					return <Strike key={index} value={block.value} />;
				case 'BOLD':
					return <Bold key={index} value={block.value} />;

				default:
					return null;
			}
		})}
	</i>
);

export default Italic;
