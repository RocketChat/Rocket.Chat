import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { size } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const MessageGenericPreviewThumbFrame = styled(Text, {
	...plainDiv,
	width: size('x96'),
	height: size('x96'),
	flexShrink: 0,
});

export type MessageGenericPreviewThumbProps = HTMLAttributes<HTMLDivElement>;

const MessageGenericPreviewThumb = (props: MessageGenericPreviewThumbProps) => (
	<MessageGenericPreviewThumbFrame
		className='rcx-message-generic-preview__thumb'
		{...(props as GetProps<typeof MessageGenericPreviewThumbFrame>)}
	/>
);

export default withFuselageProvider(MessageGenericPreviewThumb);
