import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemContent } from '../../Item';

export const SidebarItemCol = ({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemContent {...props} className={cx('rcx-sidebar-item__col', className)} />
);
