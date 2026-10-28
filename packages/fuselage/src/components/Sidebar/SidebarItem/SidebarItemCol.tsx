import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemContent } from '../../Item';

export const SidebarItemCol = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<ItemContent {...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)} className={cx('rcx-sidebar-item__col', className)} />
);
