import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import Inline from '../Inline';

type ParagraphBlockProps = {
	children: MessageParser.Inlines[];
};

const ParagraphBlock = ({ children }: ParagraphBlockProps): ReactElement => (
	<p>
		<Inline value={children} />
	</p>
);

export default ParagraphBlock;
