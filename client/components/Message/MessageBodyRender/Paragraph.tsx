import { Paragraph as ASTParagraph } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const Paragraph: FC<{ value: ASTParagraph['value'] }> = ({ value = [] }) => (
	<p>
		<Inline value={value} />
	</p>
);

export default Paragraph;
