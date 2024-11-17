import type { HTMLAttributes } from 'react';
import React from 'react';

type NavbarActionProps = HTMLAttributes<HTMLLIElement>;

export const NavbarAction = ({ children, ...props }: NavbarActionProps) => {
	return (
		<li style={{ position: 'relative' }} role='menuitem' {...props}>
			{children}
		</li>
	);
};
