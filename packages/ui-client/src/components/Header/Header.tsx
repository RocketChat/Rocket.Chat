import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const Header = (props: ComponentProps<typeof Box>) => {
	return (
		<Box
			rcx-room-header
			is='header'
			display='flex'
			justifyContent='center'
			flexDirection='column'
			overflow='hidden'
			flexShrink={0}
			{...props}
		/>
	);
};

export default Header;
