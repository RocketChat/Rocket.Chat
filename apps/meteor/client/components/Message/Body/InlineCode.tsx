import { InlineCode as ASTInlineCode } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

const InlineCode: FC<{ value: ASTInlineCode['value'] }> = ({ value }) => (
	<code className='code-colors inline'>
		{((block): string | null => {
			switch (block.type) {
				case 'PLAIN_TEXT':
					return block.value;
				default:
					return null;
			}
		})(value)}
	</code>
);

export default InlineCode;
