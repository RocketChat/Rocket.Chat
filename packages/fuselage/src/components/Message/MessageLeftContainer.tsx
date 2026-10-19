import type { GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageContainerFrame } from './MessageContainer';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = (props: MessageLeftContainerProps) => (
	<MessageContainerFrame
		left
		className='rcx-message-container rcx-message-container--left'
		{...(props as GetProps<typeof MessageContainerFrame>)}
	/>
);

export default withFuselageProvider(MessageLeftContainer);
