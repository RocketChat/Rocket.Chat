import { ASTMessage } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import Code from './Code';
import Heading from './Heading';
import Paragraph from './Paragraph';
import { UserMention } from './definitions/UserMention';

const Body: FC<{ tokens: ASTMessage; mentions: UserMention[] }> = ({
	tokens = [],
	mentions = [],
}) => (
	<>
		{tokens.map((block, index) => {
			if (block.type === 'PARAGRAPH') {
				return <Paragraph value={block.value} mentions={mentions} key={index} />;
			}
			if (block.type === 'CODE') {
				return <Code value={block.value} key={index} />;
			}

			if (block.type === 'HEADING') {
				return <Heading value={block.value} key={index} />;
			}
			return null;
		})}
	</>
);

export default memo(Body);
