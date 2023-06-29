import type { FC } from 'react';
import React from 'react';

const NavbarAction: FC = ({ children, ...props }) => {
	return (
		<li role='menuitem' {...props}>
			{children}
		</li>
	);
};

export default NavbarAction;
