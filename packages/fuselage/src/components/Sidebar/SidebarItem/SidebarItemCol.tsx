import { cx } from '../../../helpers/composeClassNames';
import { ItemContent, type ItemContentProps } from '../../Item';

export const SidebarItemCol = ({ className, ...props }: ItemContentProps) => (
	<ItemContent {...props} className={cx('rcx-sidebar-item__col', className)} />
);
