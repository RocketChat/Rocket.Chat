import type { FC } from 'react';
import React from 'react';

export const NavbarAction: FC = ({ children, ...props }) => {
	return (
		<li style={{ position: 'relative' }} role='menuitem' {...props}>
			{children}
		</li>
	);
};
