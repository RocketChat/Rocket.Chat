import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';

import MarkdownText from '../../../../../../client/components/MarkdownText';

const CannedResponsesComposerPreview: FC<{ text: string }> = ({ text }) => {
	const textM = text.split(/\n/).join('  \n');

	return (
		<Box style={{ wordBreak: 'normal' }} display='flex' flexDirection='column' pb={0} pi={12} rcx-box--animated rcx-input-box__wrapper>
			<MarkdownText w='full' flexGrow={1} content={textM} parseEmoji={true} />
		</Box>
	);
};

export default memo(CannedResponsesComposerPreview);
