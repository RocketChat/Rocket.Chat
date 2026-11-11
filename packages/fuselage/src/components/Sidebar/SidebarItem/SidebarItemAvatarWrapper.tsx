import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemMedia } from '../../Item';

export const SidebarItemAvatarWrapper = ({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'is'>) => (
	<ItemMedia {...props} className={cx('rcx-sidebar-item__avatar', className)} />
);
