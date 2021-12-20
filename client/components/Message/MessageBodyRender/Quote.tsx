import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Quote as ASTQuote } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Paragraph from './Paragraph';

const hover = css`
	&:hover,
	&:focus {
		background: ${colors.n200} !important;
		border-color: ${colors.n300} !important;
		border-inline-start-color: ${colors.n600} !important;
	}
`;

const Quote: FC<{ value: ASTQuote['value'] }> = ({ value }) => (
	<Box
		is='blockquote'
		className={hover}
		pi='x8'
		borderRadius='x2'
		borderWidth='x2'
		borderStyle='solid'
		backgroundColor='neutral-100'
		borderColor='neutral-200'
		borderInlineStartColor='neutral-600'
	>
		{value.map((item, index) => (
			<Paragraph key={index} value={item.value} />
		))}
	</Box>
);

export default Quote;
