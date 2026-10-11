import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type VideoConfPopupIconProps = { children: ReactNode };

const VideoConfPopupIcon = ({ children }: VideoConfPopupIconProps) => (
	<Box display='flex' flexShrink={0} alignItems='center' size='x18' overflow='hidden' justifyContent='center'>
		{children}
	</Box>
);

export default VideoConfPopupIcon;
