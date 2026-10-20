import type { HTMLAttributes, RefAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { IconButton } from '../Button';
import type { IconButtonProps } from '../Button/IconButton';

export type NavbarItemProps = HTMLAttributes<HTMLElement> & Partial<Omit<IconButtonProps, 'ref'>> & RefAttributes<HTMLElement>;

function NavBarItem({ children, icon, ...props }: NavbarItemProps) {
	return (
		<>
			{icon ? (
				<IconButton rcx-navbar-item icon={icon} small {...props} />
			) : (
				patchChildren(children, (childProps: { className: string | string[] }) => ({
					className: appendClassName(childProps.className, 'rcx-navbar-item'),
					...props,
				}))
			)}
		</>
	);
}

export default NavBarItem;
