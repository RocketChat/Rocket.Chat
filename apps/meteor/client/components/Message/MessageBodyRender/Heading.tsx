import { Heading as ASTHeading } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import PlainText from './PlainText';

const Heading: FC<{ value: ASTHeading['value']; level: ASTHeading['level'] }> = ({ value = [], level = 1 }) => {
	const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

	return (
		<HeadingTag>
			{value.map((block, index) => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <PlainText key={index} value={block.value} />;
					default:
						return null;
				}
			})}
		</HeadingTag>
	);
};

export default Heading;
