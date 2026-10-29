import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription } from '../../Item';

export const SidebarItemContent = ({ className, unread, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => (
	<ItemDescription
		{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
		className={cx('rcx-sidebar-item__subtitle', !!unread && 'rcx-sidebar-item__subtitle--highlighted', className)}
	/>
);
