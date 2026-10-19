import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv, truncatedText } from '../messageStyles';

const MessageGenericPreviewContentFrame = styled(Text, {
	...plainDiv,
	display: 'flex',
	flexDirection: 'row',
	fontSize: 0,
});

const MessageGenericPreviewContentWrapper = styled(Text, {
	...plainDiv,
	...truncatedText,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	flexGrow: 1,
	paddingBlock: spacing('x8'),
	paddingInline: spacing('x16'),
});

export type MessageGenericPreviewContentProps = {
	children?: ReactNode;
	thumb?: ReactNode;
};

const MessageGenericPreviewContent = ({ thumb, ...props }: MessageGenericPreviewContentProps) => (
	<MessageGenericPreviewContentFrame className='rcx-message-generic-preview__content'>
		{thumb}
		<MessageGenericPreviewContentWrapper className='rcx-message-generic-preview__content-wrapper' {...props} />
	</MessageGenericPreviewContentFrame>
);

export default withFuselageProvider(MessageGenericPreviewContent);
