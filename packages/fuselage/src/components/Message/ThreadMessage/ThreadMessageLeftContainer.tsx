import type { GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { MessageContainerFrame } from '../MessageContainer';

export type ThreadMessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageLeftContainer = (props: ThreadMessageLeftContainerProps) => (
	<MessageContainerFrame
		left
		className='rcx-message-container rcx-message-container--left'
		{...(props as GetProps<typeof MessageContainerFrame>)}
	/>
);

export default withFuselageProvider(ThreadMessageLeftContainer);
