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
				<IconButton icon={icon} small {...props} className={['rcx-navbar-item', props.className].filter(Boolean).join(' ')} />
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
