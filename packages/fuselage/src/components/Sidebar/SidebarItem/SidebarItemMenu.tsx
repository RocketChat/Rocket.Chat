import { cx } from '../../../helpers/composeClassNames';
import { ItemActions } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemMenu = ({ children, className, ...props }: ItemPartAttributes) => (
	<ItemActions {...props} reveal='hover' className={cx('rcx-sidebar-item__menu-wrapper', className)}>
		<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{children}</span>
	</ItemActions>
);
