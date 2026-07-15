import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SideRailActionsProps = {
	children: ReactNode;
};

const SideRailActions = ({ children }: SideRailActionsProps) => (
	<Box
		display='flex'
		flexDirection='column'
		alignItems='center'
		flexShrink={0}
		width='x44'
		height='full'
		bg='surface-sidebar'
		borderInlineEndWidth='default'
		borderInlineEndStyle='solid'
		borderInlineEndColor='stroke-light'
		p={8}
	>
		<ButtonGroup vertical>{children}</ButtonGroup>
	</Box>
);

export default SideRailActions;
