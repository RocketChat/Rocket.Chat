import { cx } from '../../../helpers/composeClassNames';
import { ItemContent } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemCol = ({ className, ...props }: ItemPartAttributes) => (
	<ItemContent {...props} className={cx('rcx-sidebar-item__col', className)} />
);
