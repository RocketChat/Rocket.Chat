import { cx } from '../../../helpers/composeClassNames';
import { ItemMeta } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemTimestamp = ({ className, ...props }: ItemPartAttributes) => (
	<ItemMeta {...props} className={cx('rcx-sidebar-item__timestamp', className)} />
);
