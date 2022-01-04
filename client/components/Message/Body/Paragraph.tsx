import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';
import { UserMention } from './definitions/UserMention';

const Paragraph: FC<{ value: ASTParagraph['value']; mentions: UserMention[] }> = ({ value = [], mentions }) => (
	<p>
		<Inline value={value} mentions={mentions} />
	</p>
);

export default Paragraph;
