import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type ParagraphBlockProps = {
	children: MessageParser.Inlines[];
};

const ParagraphBlock = ({ children }: ParagraphBlockProps): ReactElement => (
	<div>
		<InlineElements children={children} />
	</div>
);

export default ParagraphBlock;
