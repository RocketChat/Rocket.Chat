import { cx } from '../../../helpers/composeClassNames';
import { ItemMeta, type ItemMetaProps } from '../../Item';

export const SidebarItemTimestamp = ({ className, unread, ...props }: { unread?: boolean } & ItemMetaProps) => (
	<ItemMeta {...props} className={cx('rcx-sidebar-item__timestamp', !!unread && 'rcx-sidebar-item__timestamp--highlighted', className)} />
);
