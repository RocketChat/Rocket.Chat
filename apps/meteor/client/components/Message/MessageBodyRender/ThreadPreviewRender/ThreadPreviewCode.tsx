import { Code as ASTCode, Plain } from '@rocket.chat/message-parser';
import React, { FC, useState } from 'react';

import InlineCode from '../InlineCode';

const ThreadPreviewCode: FC<ASTCode> = ({ value = [] }) => {
	const [code] = useState<Plain>(() => ({
		type: 'PLAIN_TEXT',
		value: value.map((line) => line.value.value).join(' '),
	}));

	return <InlineCode value={code} />;
};

export default ThreadPreviewCode;
