import { InlineCode as ASTInlineCode } from '@rocket.chat/message-parser';
import React, { ReactElement, FC } from 'react';

import PlainSpan from './elements/PlainSpan';

const InlineCode: FC<{ value: ASTInlineCode['value'] }> = ({ value }) => (
	<code className='code-colors inline'>
		{((block): ReactElement | null => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <PlainSpan text={block.value} />;
				default:
					return null;
			}
		})(value)}
	</code>
);

export default InlineCode;
