import { cx } from '../../../helpers/composeClassNames';
import { ItemTitle } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemTitle = ({ className, ...props }: ItemPartAttributes) => (
	<ItemTitle {...props} className={cx('rcx-sidebar-item__title', className)} />
);
