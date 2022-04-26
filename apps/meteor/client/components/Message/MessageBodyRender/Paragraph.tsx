import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const paragraphClass = css`
	&:empty::before {
		content: '';
		display: inline-block;
	}
`;

const Paragraph: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => (
	<Box is='p' className={paragraphClass}>
		<Inline value={value} />
	</Box>
);

export default Paragraph;
