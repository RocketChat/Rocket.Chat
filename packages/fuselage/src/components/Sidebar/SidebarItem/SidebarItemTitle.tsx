import { cx } from '../../../helpers/composeClassNames';
import { ItemTitle } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemTitle = ({ className, unread, ...props }: { unread?: boolean } & ItemPartAttributes) => (
	<ItemTitle {...props} className={cx('rcx-sidebar-item__title', !!unread && 'rcx-sidebar-item__title--highlighted', className)} />
);
