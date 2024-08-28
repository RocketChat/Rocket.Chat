import { SideBarListItem, SideBarItem, SideBarItemAvatarWrapper, SideBarItemTitle, SideBarItemMenu } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

type MediumProps = {
	title: string;
	titleIcon?: React.ReactNode;
	avatar: React.ReactNode | boolean;
	icon?: string;
	actions?: React.ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => React.ReactNode;
	badges?: React.ReactNode;
	selected?: boolean;
	menuOptions?: any;
};

const Medium = ({ icon, title, avatar, actions, href, badges, unread, menu, ...props }: MediumProps) => {
	return (
		<SideBarListItem>
			<SideBarItem href={href} {...props}>
				<SideBarItemAvatarWrapper>{avatar}</SideBarItemAvatarWrapper>
				{icon && icon}
				<SideBarItemTitle unread={unread}>{title}</SideBarItemTitle>
				{badges && badges}
				{actions && actions}
				{menu && <SideBarItemMenu>{menu()}</SideBarItemMenu>}
			</SideBarItem>
		</SideBarListItem>
	);
};

export default memo(Medium);
