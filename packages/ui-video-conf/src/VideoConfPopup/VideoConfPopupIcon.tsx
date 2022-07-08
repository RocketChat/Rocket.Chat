import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

const VideoConfPopupIcon = ({ children }: { children: ReactNode }): ReactElement => (
	<Box display='flex' flexShrink={0} alignItems='center' size={18} overflow='hidden' justifyContent='center'>
		{children}
	</Box>
);

export default VideoConfPopupIcon;
