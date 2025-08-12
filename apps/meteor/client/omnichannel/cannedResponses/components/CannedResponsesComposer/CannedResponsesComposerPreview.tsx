import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';

type CannedResponsesComposerPreviewProps = { text: string };

const CannedResponsesComposerPreview = ({ text }: CannedResponsesComposerPreviewProps) => {
	const textM = text.split(/\n/).join('  \n');

	return (
		<Box style={{ wordBreak: 'normal' }} display='flex' flexDirection='column' pb={0} pi={12} rcx-box--animated rcx-input-box__wrapper>
			<MarkdownText w='full' flexGrow={1} content={textM} parseEmoji={true} />
		</Box>
	);
};

export default memo(CannedResponsesComposerPreview);
