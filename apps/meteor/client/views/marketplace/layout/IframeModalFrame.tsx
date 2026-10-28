import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type IframeModalFrameProps = {
	children: ReactNode;
};

/**
 * The rounded, padded surface that fills a modal with the marketplace page it embeds.
 */
const IframeModalFrame = ({ children }: IframeModalFrameProps) => (
	<Box padding='x12' width='full' height='full' flexGrow={1} backgroundColor='white' borderRadius='large'>
		{children}
	</Box>
);

export default IframeModalFrame;
