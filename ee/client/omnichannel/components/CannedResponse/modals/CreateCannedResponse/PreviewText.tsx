import { Box } from '@rocket.chat/fuselage';
import { parser } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import MessageBody from '../../../../../../../client/components/Message/Body';

const PreviewText: FC<{ text: any }> = ({ text }) => {
	const msg = parser(text) as any;

	return (
		<Box
			rows={10}
			display='flex'
			flexDirection='column'
			pbs='12px'
			pi='16px'
			pbe='16px'
			rcx-box--animated
			rcx-input-box__wrapper
		>
			<MessageBody tokens={msg} mentions={[]} />
		</Box>
	);
};

export default memo(PreviewText);
