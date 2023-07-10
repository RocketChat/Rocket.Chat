import type { FC } from 'react';
import React from 'react';

export const NavbarAction: FC = ({ children, ...props }) => {
	return (
		<li role='menuitem' {...props}>
			{children}
		</li>
	);
};
