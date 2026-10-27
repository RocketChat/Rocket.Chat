import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ABACFilterBarProps = {
	children: ReactNode;
};

const ABACFilterBar = ({ children }: ABACFilterBarProps) => (
	<Box display='flex' flexDirection='row' gap='x8' marginBlock='x24'>
		{children}
	</Box>
);

export default ABACFilterBar;
