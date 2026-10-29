import { cx } from '../../../helpers/composeClassNames';
import { ItemDescription, type ItemDescriptionProps } from '../../Item';

export const SidebarItemContent = ({ className, unread, ...props }: { unread?: boolean } & ItemDescriptionProps) => (
	<ItemDescription
		{...props}
		className={cx('rcx-sidebar-item__subtitle', !!unread && 'rcx-sidebar-item__subtitle--highlighted', className)}
	/>
);
