import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';

import MarkdownText from '../../../../../components/MarkdownText';

export type CannedResponsesComposerPreviewProps = { text: string };

const CannedResponsesComposerPreview = ({ text }: CannedResponsesComposerPreviewProps) => {
	const textM = text.split(/\n/).join('  \n');

	return (
		<Box
			style={{ wordBreak: 'normal' }}
			display='flex'
			flexDirection='column'
			paddingBlock={0}
			paddingInline={12}
			rcx-box--animated
			rcx-input-box__wrapper
		>
			<MarkdownText width='full' flexGrow={1} content={textM} parseEmoji={true} />
		</Box>
	);
};

export default memo(CannedResponsesComposerPreview);
