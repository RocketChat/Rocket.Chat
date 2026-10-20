import type { Keys as Icons } from '@rocket.chat/icons';
import { useContext, type LinkHTMLAttributes, type ReactNode } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { cx } from '../../helpers/composeClassNames';
import { patchChildren } from '../../helpers/patchChildren';
import { Icon } from '../Icon';
import { Item, ItemActions, ItemIcon, ItemTitle, type ItemProps } from '../Item';
import { SidebarCollapsedContext } from './Sidebar';
import { frameStyle } from './sidebarStyles';

export type SidebarLinkProps = {
	selected?: boolean;
	icon?: Icons;
	badge?: ReactNode;
	menu?: ReactNode;
} & LinkHTMLAttributes<HTMLAnchorElement>;

// A collapsed sidebar shows only the icon until it is hovered
const collapsedTitleStyle = frameStyle({ display: { 'default': 'none', 'group-hover/rcx-sidebar': 'block' } });

const SidebarLink = ({ selected, icon, badge, menu, className, children, ...props }: SidebarLinkProps) => {
	const collapsed = useContext(SidebarCollapsedContext);

	return (
		<Item
			is='a'
			inset='md'
			role='link'
			tabIndex={0}
			selected={selected}
			className={cx('rcx-sidebar-link', 'rcx-sidebar-item', !!selected && 'rcx-sidebar-item--selected', className)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.code === 'Enter' && e.stopPropagation()}
			{...(props as Omit<ItemProps, 'is' | 'selected'>)}
		>
			{icon && (
				<ItemIcon className='rcx-sidebar-item__icon'>
					<Icon name={icon} size='x20' />
				</ItemIcon>
			)}
			<ItemTitle is='span' {...(collapsed && collapsedTitleStyle)} className='rcx-sidebar-item__title'>
				{children}
			</ItemTitle>
			{badge}
			{menu && (
				<ItemActions reveal='hover' className='rcx-sidebar-item__menu-wrapper'>
					{patchChildren(
						<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{menu}</span>,
						(childProps: { className: string | string[] }) => ({
							className: appendClassName(childProps.className, 'rcx-sidebar-item__menu'),
						}),
					)}
				</ItemActions>
			)}
		</Item>
	);
};

export default SidebarLink;
