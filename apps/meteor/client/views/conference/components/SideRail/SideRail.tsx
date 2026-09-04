import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SideRailProps = {
	children: ReactNode;
};

const SideRail = ({ children }: SideRailProps) => (
	<Box display='flex' flexDirection='row' flexShrink={0} height='full' position='relative'>
		{children}
	</Box>
);

export default SideRail;
