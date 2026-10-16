import type { HTMLAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { cx } from '../../helpers/composeClassNames';
import { patchChildren } from '../../helpers/patchChildren';
import { ItemActions } from '../Item';

export const SidebarCollapseGroupMenu = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<ItemActions
		{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
		reveal='hover'
		className={cx('rcx-sidebar-collapse-group__menu-wrapper', className)}
	>
		{patchChildren(
			<span className='rcx-box rcx-box--full rcx-sidebar-collapse-group__menu'>{children}</span>,
			(childProps: { className: string | string[] }) => ({
				className: appendClassName(childProps.className, 'rcx-sidebar-collapse-group__menu'),
			}),
		)}
	</ItemActions>
);
