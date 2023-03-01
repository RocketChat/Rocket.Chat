import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';

import MarkdownText from '../../../../../../../client/components/MarkdownText';

const PreviewText: FC<{ text: string }> = ({ text }) => {
	const textM = text.split(/\n/).join('  \n');

	return (
		<Box
			style={{ wordBreak: 'normal' }}
			display='flex'
			flexDirection='column'
			pbs='12px'
			pi='16px'
			pbe='16px'
			rcx-box--animated
			rcx-input-box__wrapper
		>
			<MarkdownText w='full' flexGrow={1} content={textM} parseEmoji={true} />
		</Box>
	);
};

export default memo(PreviewText);
