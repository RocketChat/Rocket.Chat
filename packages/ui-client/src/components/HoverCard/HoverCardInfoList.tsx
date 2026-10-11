import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HoverCardInfoListProps = { children: ReactNode };

const HoverCardInfoList = ({ children }: HoverCardInfoListProps) => (
	<Box is='dl' display='flex' flexDirection='column' margin={0}>
		{children}
	</Box>
);

export default HoverCardInfoList;
