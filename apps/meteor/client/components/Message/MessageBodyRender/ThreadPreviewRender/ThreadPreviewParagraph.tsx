import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from '../Inline';

const ThreadPreviewParagraph: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => (
	<span>
		<Inline value={value} />
	</span>
);

export default ThreadPreviewParagraph;
