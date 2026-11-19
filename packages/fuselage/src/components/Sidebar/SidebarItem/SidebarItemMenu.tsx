import { appendClassName } from '../../../helpers/appendClassName';
import { cx } from '../../../helpers/composeClassNames';
import { patchChildren } from '../../../helpers/patchChildren';
import { ItemActions } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemMenu = ({ children, className, ...props }: ItemPartAttributes) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-sidebar-item__menu-wrapper', className)}>
		{patchChildren(
			<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{children}</span>,
			(childProps: { className: string | string[] }) => ({
				className: appendClassName(childProps.className, 'rcx-sidebar-item__menu'),
			}),
		)}
	</ItemActions>
);
