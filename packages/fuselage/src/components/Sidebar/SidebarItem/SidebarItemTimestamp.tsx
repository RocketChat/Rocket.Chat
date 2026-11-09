import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';
import { ItemMeta } from '../../Item/index.js';

export const SidebarItemTimestamp = ({
	className,
	unread,
	...props
}: { unread?: boolean } & Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemMeta {...props} className={cx('rcx-sidebar-item__timestamp', !!unread && 'rcx-sidebar-item__timestamp--highlighted', className)} />
);
