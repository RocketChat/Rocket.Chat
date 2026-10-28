import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type RoomHoverCardFooterProps = { children: ReactNode };

const RoomHoverCardFooter = ({ children }: RoomHoverCardFooterProps) => (
	<Box backgroundColor='surface-tint' paddingInline={18} paddingBlockStart={10} paddingBlockEnd={14}>
		<ButtonGroup wrap>{children}</ButtonGroup>
	</Box>
);

export default RoomHoverCardFooter;
