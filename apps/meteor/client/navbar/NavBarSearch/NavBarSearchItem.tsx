import { SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

type NavBarSearchItemProps = {
	title: string;
	avatar: ReactElement;
	icon: ReactNode;
	actions?: ReactElement;
	href?: string;
	unread?: boolean;
	selected?: boolean;
	badges?: ReactElement;
	clickable?: boolean;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const NavBarSearchItem = ({ icon, title, avatar, actions, unread, badges, ...props }: NavBarSearchItemProps) => {
	return (
		<SidebarV2Item role='option' {...props}>
			{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
			{icon && icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges && badges}
			{actions && actions}
		</SidebarV2Item>
	);
};

export default NavBarSearchItem;
