import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerPlainSpan from './ComposerPlainSpan';
import { renderInlineBlock } from './renderInlineBlock';

type ComposerInlineElementsProps = {
	children: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[];
};

const ComposerInlineElements = ({ children }: ComposerInlineElementsProps): ReactElement => (
	<>
		{children.map((child, index) => {
			if (child.type === undefined) {
				return <ComposerPlainSpan key={index} text={child.fallback.value} />;
			}

			return renderInlineBlock(child, index);
		})}
	</>
);

export default ComposerInlineElements;
