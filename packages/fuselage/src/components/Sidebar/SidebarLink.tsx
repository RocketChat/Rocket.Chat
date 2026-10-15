import type { Keys as Icons } from '@rocket.chat/icons';
import type { LinkHTMLAttributes, ReactNode } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { Icon } from '../Icon';

export type SidebarLinkProps = {
	selected?: boolean;
	icon?: Icons;
	badge?: ReactNode;
	menu?: ReactNode;
} & LinkHTMLAttributes<HTMLAnchorElement>;

const SidebarLink = ({ selected, icon, badge, menu, ...props }: SidebarLinkProps) => (
	<a
		role='link'
		tabIndex={0}
		className={['rcx-box rcx-box--full', 'rcx-sidebar-link', 'rcx-sidebar-item', selected && 'rcx-sidebar-item--selected']
			.filter(Boolean)
			.join(' ')}
		onClick={(e) => e.stopPropagation()}
		onKeyDown={(e) => e.code === 'Enter' && e.stopPropagation()}
		{...props}
	>
		{icon && <Icon name={icon} size='x20' className='rcx-sidebar-item__icon' />}
		<span className='rcx-box rcx-box--full rcx-sidebar-item__title'>{props.children}</span>
		{badge}
		{menu &&
			patchChildren(
				<span className='rcx-box rcx-box--full rcx-sidebar-item__menu-wrapper'>{menu}</span>,
				(childProps: { className: string | string[] }) => ({
					className: appendClassName(childProps.className, 'rcx-box rcx-box--full rcx-sidebar-item__menu rcx-box--animated'),
				}),
			)}
	</a>
);

export default SidebarLink;
