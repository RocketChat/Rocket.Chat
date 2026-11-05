import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemRow } from '../../Item';

export const SidebarItemRow = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<ItemRow {...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)} className={cx('rcx-sidebar-item__row', className)} />
);
