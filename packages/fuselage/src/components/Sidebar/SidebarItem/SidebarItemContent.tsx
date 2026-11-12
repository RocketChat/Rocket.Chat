import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemContent = ({ className, unread, ...props }: { unread?: boolean } & ItemPartAttributes) => (
	<ItemDescription
		{...props}
		className={cx('rcx-sidebar-item__subtitle', !!unread && 'rcx-sidebar-item__subtitle--highlighted', className)}
	/>
);
