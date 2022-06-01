import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import ParagraphBlock from './ParagraphBlock';

const hover = css`
	&:hover,
	&:focus {
		background: ${colors.n200} !important;
		border-color: ${colors.n300} !important;
		border-inline-start-color: ${colors.n600} !important;
	}
`;

type QuoteBlockProps = {
	paragraphs: MessageParser.Paragraph[];
};

const QuoteBlock = ({ paragraphs }: QuoteBlockProps): ReactElement => (
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
		{paragraphs.map((paragraph, index) => (
			<ParagraphBlock key={index} chunks={paragraph.value} />
		))}
	</Box>
);

export default QuoteBlock;
