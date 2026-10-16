import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemMeta } from '../../Item';

export const SidebarItemTimestamp = ({ className, unread, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => (
	<ItemMeta
		{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
		className={cx('rcx-sidebar-item__timestamp', !!unread && 'rcx-sidebar-item__timestamp--highlighted', className)}
	/>
);
