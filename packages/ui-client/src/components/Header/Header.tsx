import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import HeaderDivider from './HeaderDivider';

export type HeaderProps = ComponentPropsWithoutRef<typeof Box>;

const Header = (props: HeaderProps) => (
	<Box
		rcx-room-header
		is='header'
		color='default'
		display='flex'
		justifyContent='center'
		flexDirection='column'
		overflow='hidden'
		flexShrink={0}
	>
		<Box
			paddingInline='x16'
			height='x44'
			display='flex'
			flexGrow={1}
			justifyContent='center'
			alignItems='center'
			overflow='hidden'
			flexDirection='row'
			backgroundColor='room'
			{...props}
		/>
		<HeaderDivider />
	</Box>
);

export default Header;
