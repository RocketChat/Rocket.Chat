import type { Keys as Icons } from '@rocket.chat/icons';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Icon } from '../Icon';
import { Item, ItemActions, ItemIcon, ItemTitle } from '../Item';

export type SidebarLinkProps = {
	selected?: boolean;
	icon?: Icons;
	badge?: ReactNode;
	menu?: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'is'>;

const SidebarLink = ({ selected, icon, badge, menu, className, children, ...props }: SidebarLinkProps) => (
	<Item
		is='a'
		inset='md'
		role='link'
		tabIndex={0}
		selected={selected}
		tone='link'
		className={cx('rcx-sidebar-link', 'rcx-sidebar-item', !!selected && 'rcx-sidebar-item--selected', className)}
		onClick={(e) => e.stopPropagation()}
		onKeyDown={(e) => e.code === 'Enter' && e.stopPropagation()}
		{...props}
	>
		{icon && (
			<ItemIcon className='rcx-sidebar-item__icon'>
				<Icon name={icon} size='x20' />
			</ItemIcon>
		)}
		<ItemTitle is='span' className='rcx-sidebar-item__title'>
			{children}
		</ItemTitle>
		{badge}
		{menu && (
			<ItemActions reveal='hover' className='rcx-sidebar-item__menu-wrapper'>
				<span className='rcx-box rcx-box--full rcx-sidebar-item__menu'>{menu}</span>
			</ItemActions>
		)}
	</Item>
);

export default SidebarLink;
