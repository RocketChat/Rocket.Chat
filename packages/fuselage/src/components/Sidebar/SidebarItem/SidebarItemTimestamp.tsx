import { cx } from '../../../helpers/composeClassNames';
import { ItemMeta } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemTimestamp = ({ className, unread, ...props }: { unread?: boolean } & ItemPartAttributes) => (
	<ItemMeta {...props} className={cx('rcx-sidebar-item__timestamp', !!unread && 'rcx-sidebar-item__timestamp--highlighted', className)} />
);
