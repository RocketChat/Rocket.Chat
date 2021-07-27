import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import MarkdownText from '../../../../../../../client/components/MarkdownText';

const PreviewText: FC<{ text: string }> = ({ text }) => (
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
		<MarkdownText content={text} parseEmoji={true} />
	</Box>
);

export default memo(PreviewText);
