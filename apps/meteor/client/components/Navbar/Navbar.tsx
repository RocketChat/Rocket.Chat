import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export const Navbar: FC = ({ children }) => {
	return (
		<Box aria-label='main-navigation' bg='surface-tint' is='nav' pb={16} pi={14}>
			<ButtonGroup large role='menubar' is='ul' vertical>
				{children}
			</ButtonGroup>
		</Box>
	);
};
