import { cx } from '../../../helpers/composeClassNames';
import { ItemMedia } from '../../Item';
import type { ItemPartAttributes } from '../../Item/types';

export const SidebarItemAvatarWrapper = ({ className, ...props }: ItemPartAttributes) => (
	<ItemMedia {...props} className={cx('rcx-sidebar-item__avatar', className)} />
);
