import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemMedia } from '../../Item';

export const SidebarItemAvatarWrapper = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<ItemMedia {...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)} className={cx('rcx-sidebar-item__avatar', className)} />
);
