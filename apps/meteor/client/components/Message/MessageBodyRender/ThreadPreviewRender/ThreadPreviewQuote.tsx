import { Box } from '@rocket.chat/fuselage';
import { Quote as ASTQuote } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import ThreadPreviewParagraph from './ThreadPreviewParagraph';

const ThreadPreviewQuote: FC<{ value: ASTQuote['value'] }> = ({ value }) => (
	<Box
		is='blockquote'
		pi='x4'
		mb='neg-x2'
		borderRadius='x2'
		borderWidth='x2'
		borderStyle='solid'
		backgroundColor='neutral-100'
		borderColor='neutral-200'
		borderInlineStartColor='neutral-600'
	>
		{value.map((item, index) => (
			<ThreadPreviewParagraph key={index} value={item.value} />
		))}
	</Box>
);

export default ThreadPreviewQuote;
