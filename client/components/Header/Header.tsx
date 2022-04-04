import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import HeaderDivider from './HeaderDivider';

const Header: FC<any> = (props) => {
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
