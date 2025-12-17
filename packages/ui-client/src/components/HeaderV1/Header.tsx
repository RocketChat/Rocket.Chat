import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';

import HeaderDivider from './HeaderDivider';

export type HeaderProps = ComponentPropsWithoutRef<typeof Box>;

const Header = (props: HeaderProps) => {
	const { isMobile } = useLayout();

	return (
		<Box
			rcx-room-header
			is='header'
			height='x64'
			display='flex'
			justifyContent='center'
			flexDirection='column'
			overflow='hidden'
			flexShrink={0}
		>
			<Box
				height='x64'
				mi='neg-x4'
				pi={isMobile ? 'x12' : 'x24'}
				display='flex'
				flexGrow={1}
				justifyContent='center'
				alignItems='center'
				overflow='hidden'
				flexDirection='row'
				{...props}
			/>
			<HeaderDivider />
		</Box>
	);
};

export default Header;
