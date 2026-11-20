import { cx } from '../../../helpers/composeClassNames';
import { ItemRow, type ItemRowProps } from '../../Item';

export const SidebarItemRow = ({ className, ...props }: ItemRowProps) => (
	<ItemRow {...props} fixedHeight className={cx('rcx-sidebar-item__row', className)} />
);
