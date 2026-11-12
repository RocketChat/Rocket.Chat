import type { HTMLAttributes, RefAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName.js';
import { cx } from '../../helpers/composeClassNames.js';
import { patchChildren } from '../../helpers/patchChildren.js';
import type { IconButtonProps } from '../Button/IconButton.js';
import { IconButton } from '../Button/index.js';

export type NavbarItemProps = HTMLAttributes<HTMLElement> & Partial<Omit<IconButtonProps, 'ref'>> & RefAttributes<HTMLElement>;

function NavBarItem({ children, icon, className, ...props }: NavbarItemProps) {
	return (
		<>
			{icon ? (
				<IconButton icon={icon} size='small' {...props} className={cx('rcx-navbar-item', className)} />
			) : (
				patchChildren(children, (childProps: { className: string | string[] }) => ({
					...props,
					className: appendClassName(childProps.className, cx('rcx-navbar-item', className)),
				}))
			)}
		</>
	);
}

export default NavBarItem;
