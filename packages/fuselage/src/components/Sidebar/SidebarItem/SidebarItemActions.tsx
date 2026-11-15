import { cx } from '../../../helpers/composeClassNames';
import { ItemActions, type ItemActionsProps } from '../../Item';

export type SidebarItemActionsProps = Omit<ItemActionsProps, 'reveal'>;

/**
 * Always-visible buttons of a container `SidebarItem`, such as accepting or rejecting a call.
 * For actions shown only on hover, use `SidebarItemMenu`.
 */
export const SidebarItemActions = ({ className, ...props }: SidebarItemActionsProps) => (
	<ItemActions {...props} className={cx('rcx-sidebar-item__actions', className)} />
);
