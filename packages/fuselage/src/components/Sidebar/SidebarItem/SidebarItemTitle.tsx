import { cx } from '../../../helpers/composeClassNames';
import { ItemTitle, type ItemTitleProps } from '../../Item';

export const SidebarItemTitle = ({ className, unread, ...props }: { unread?: boolean } & ItemTitleProps) => (
	<ItemTitle {...props} className={cx('rcx-sidebar-item__title', !!unread && 'rcx-sidebar-item__title--highlighted', className)} />
);
