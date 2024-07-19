import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

type NavbarProps = {
	children?: ReactNode;
};

export const Navbar = ({ children }: NavbarProps) => {
	return (
		<Box aria-label='main-navigation' bg='surface-tint' is='nav' pb={16} pi={14}>
			<ButtonGroup large role='menubar' is='ul' vertical>
				{children}
			</ButtonGroup>
		</Box>
	);
};
