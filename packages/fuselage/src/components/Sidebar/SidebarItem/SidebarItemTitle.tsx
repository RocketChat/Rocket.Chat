import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemTitle } from '../../Item';

export const SidebarItemTitle = ({ className, unread, ...props }: { unread?: boolean } & Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemTitle {...props} className={cx('rcx-sidebar-item__title', !!unread && 'rcx-sidebar-item__title--highlighted', className)} />
);
