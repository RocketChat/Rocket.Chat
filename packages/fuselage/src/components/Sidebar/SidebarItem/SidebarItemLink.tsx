import { cx } from '../../../helpers/composeClassNames';
import { ItemLink, type ItemLinkProps } from '../../Item';

export type SidebarItemLinkProps = ItemLinkProps;

/**
 * The primary target of a container `SidebarItem` (`is='div'`). Place it inside `SidebarItemTitle`:
 * it covers the whole row, so menus and buttons sit beside it instead of inside it.
 */
export const SidebarItemLink = ({ className, ...props }: SidebarItemLinkProps) => (
	<ItemLink {...props} className={cx('rcx-sidebar-item__link', className)} />
);
