import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ABACRoomNameIconProps = {
	children: ReactNode;
};

const ABACRoomNameIcon = ({ children }: ABACRoomNameIconProps) => (
	<Box is='span' marginInline='x8'>
		{children}
	</Box>
);

export default ABACRoomNameIcon;
