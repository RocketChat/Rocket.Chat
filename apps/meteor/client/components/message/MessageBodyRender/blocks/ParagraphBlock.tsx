import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import Inline from '../Inline';

type ParagraphBlockProps = {
	chunks: MessageParser.Inlines[];
};

const ParagraphBlock = ({ chunks: value = [] }: ParagraphBlockProps): ReactElement => (
	<p>
		<Inline value={value} />
	</p>
);

export default ParagraphBlock;
