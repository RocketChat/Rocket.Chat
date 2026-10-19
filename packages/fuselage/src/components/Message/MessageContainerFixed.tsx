import type { GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageContainerFrame } from './MessageContainer';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = (props: MessageContainerFixedProps) => (
	<MessageContainerFrame
		fixed
		className='rcx-message-container rcx-message-container--fixed'
		{...(props as GetProps<typeof MessageContainerFrame>)}
	/>
);

export default withFuselageProvider(MessageContainerFixed);
