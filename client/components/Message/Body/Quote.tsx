import { Box } from '@rocket.chat/fuselage';
import { Quote as ASTQuote } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Paragraph from './Paragraph';

const Quote: FC<{ value: ASTQuote['value'] }> = ({ value }) => (
	<Box is='blockquote' backgroundColor='neutral-200' pi='x8'>
		{value.map((item, index) => (
			<Paragraph key={index} value={item.value} mentions={[]} />
		))}
	</Box>
);

export default Quote;
