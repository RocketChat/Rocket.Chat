import { SidebarItem, SidebarItemAvatarWrapper, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';

import { useSearchOptionProps } from './hooks/useSearchActiveOption';

export type NavBarSearchItemProps = {
	title: string;
	avatar: ReactNode;
	icon: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	selected?: boolean;
	badges?: ReactNode;
	clickable?: boolean;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const NavBarSearchItem = ({ icon, title, avatar, actions, unread, badges, ...props }: NavBarSearchItemProps) => {
	const optionProps = useSearchOptionProps(props.id);

	return (
		<SidebarItem role='option' {...props} {...optionProps}>
			{avatar && <SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>}
			{icon && icon}
			<SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>
			{badges && badges}
			{actions && actions}
		</SidebarItem>
	);
};

export default NavBarSearchItem;
