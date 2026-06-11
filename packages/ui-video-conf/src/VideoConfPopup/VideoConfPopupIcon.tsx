import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VideoConfPopupIcon = ({ children }: { children: ReactNode }) => (
	<Box display='flex' flexShrink={0} alignItems='center' size='x18' overflow='hidden' justifyContent='center'>
		{children}
	</Box>
);

export default VideoConfPopupIcon;
