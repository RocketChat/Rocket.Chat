import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import HeaderDivider from './HeaderDivider';

type HeaderProps = BoxProps;

const Header: FC<HeaderProps> = (props) => <Box
	rcx-room-header
	is='header'
	height='x64'
	mi='neg-x4'
	display='flex'
	justifyContent='center'
	flexDirection='column'
	overflow='hidden'
	flexShrink={0}
>
	<Box
		height='x64'
		pi='x24'
		display='flex'
		flexGrow={1}
		justifyContent='center'
		alignItems='center'
		overflow='hidden'
		flexDirection='row'
		{...props}
	/>
	<HeaderDivider/>
</Box>;

export default Header;
