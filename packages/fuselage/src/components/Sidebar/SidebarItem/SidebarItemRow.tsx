import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemRow } from '../../Item';

export const SidebarItemRow = ({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemRow {...props} className={cx('rcx-sidebar-item__row', className)} />
);
