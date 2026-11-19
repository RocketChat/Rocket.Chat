import type { HTMLAttributes, RefAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { cx } from '../../helpers/composeClassNames';
import { patchChildren } from '../../helpers/patchChildren';
import { IconButton } from '../Button';
import type { IconButtonProps } from '../Button/IconButton';

export type NavbarItemProps = HTMLAttributes<HTMLElement> & Partial<Omit<IconButtonProps, 'ref'>> & RefAttributes<HTMLElement>;

/**
 * A button in a `NavBar`: an `IconButton` when given an `icon`, otherwise its child, such as a `Menu`, styled to match.
 */
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
