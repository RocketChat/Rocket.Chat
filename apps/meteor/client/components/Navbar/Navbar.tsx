import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const Navbar: FC = ({ children }) => {
	return (
		<Box aria-label='main-navigation' bg='surface-tint' is='nav' width='x60' pb='x16'>
			<ButtonGroup large role='menubar' is='ul' vertical>
				{children}
			</ButtonGroup>
		</Box>
	);
};

export default Navbar;
