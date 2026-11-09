import type { HTMLAttributes } from 'react';

import { appendClassName } from '../../../helpers/appendClassName.js';
import { cx } from '../../../helpers/composeClassNames.js';
import { patchChildren } from '../../../helpers/patchChildren.js';
import { ItemActions } from '../../Item/index.js';

export const SidebarItemMenu = ({ children, className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-sidebar-item__menu-wrapper', className)}>
		{patchChildren(
			<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{children}</span>,
			(childProps: { className: string | string[] }) => ({
				className: appendClassName(childProps.className, 'rcx-sidebar-item__menu'),
			}),
		)}
	</ItemActions>
);
