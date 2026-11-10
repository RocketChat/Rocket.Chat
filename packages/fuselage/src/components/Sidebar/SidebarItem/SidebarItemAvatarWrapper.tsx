import { cx } from '../../../helpers/composeClassNames';
import { ItemMedia, type ItemMediaProps } from '../../Item';

export const SidebarItemAvatarWrapper = ({ className, ...props }: Omit<ItemMediaProps, 'variant'>) => (
	<ItemMedia {...props} className={cx('rcx-sidebar-item__avatar', className)} />
);
