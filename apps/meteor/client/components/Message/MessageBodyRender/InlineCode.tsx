import { InlineCode as ASTInlineCode } from '@rocket.chat/message-parser';
import React, { ReactElement, FC } from 'react';

import PlainText from './PlainText';

const InlineCode: FC<{ value: ASTInlineCode['value'] }> = ({ value }) => (
	<code className='code-colors inline'>
		{((block): ReactElement | null => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return <PlainText value={block.value} />;
				default:
					return null;
			}
		})(value)}
	</code>
);

export default InlineCode;
