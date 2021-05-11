import { Code as ASTCode } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import CodeLine from './CodeLine';

const Code: FC<{ value: ASTCode['value'] }> = ({ value = [] }) => (
	<code className='code-colors hljs'>
		{value.map((block, index) => {
			switch (block.type) {
				case 'CODE_LINE':
					return <CodeLine key={index} value={block.value} />;
				default:
					return null;
			}
		})}
	</code>
);

export default Code;
