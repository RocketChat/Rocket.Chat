import type { ReactNode } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { cx } from '../../helpers/composeClassNames';
import { patchChildren } from '../../helpers/patchChildren';
import { IconButton } from '../Button';
import type { IconButtonProps } from '../Button/IconButton';

export type NavbarItemProps = {
	/** Without an icon, the item takes these props onto its child instead of rendering an `IconButton`. */
	children?: ReactNode;
} & Partial<IconButtonProps>;

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
