import { MessageParagraph } from '@rocket.chat/fuselage';
import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const Paragraph: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => (
	<MessageParagraph>
		<Inline value={value} />
	</MessageParagraph>
);

export default Paragraph;
