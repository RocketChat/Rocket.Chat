import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription } from '../../Item';

export const SidebarItemContent = ({ className, unread, ...props }: { unread?: boolean } & Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemDescription
		{...props}
		className={cx('rcx-sidebar-item__subtitle', !!unread && 'rcx-sidebar-item__subtitle--highlighted', className)}
	/>
);
