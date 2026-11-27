import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';

export type CannedResponsesComposerPreviewProps = { text: string };

/**
 * The canned response's message rendered as Markdown, framed like the text area it replaces.
 */
const CannedResponsesComposerPreview = ({ text }: CannedResponsesComposerPreviewProps) => {
	const textM = text.split(/\n/).join('  \n');

	return (
		<Box
			style={{ wordBreak: 'normal' }}
			display='flex'
			flexDirection='column'
			paddingBlock='none'
			paddingInline='x12'
			rcx-box--animated
			rcx-input-box__wrapper
		>
			<MarkdownText width='full' flexGrow={1} content={textM} parseEmoji={true} />
		</Box>
	);
};

export default memo(CannedResponsesComposerPreview);
