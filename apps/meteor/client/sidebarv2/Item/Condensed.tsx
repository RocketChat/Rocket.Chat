import { SideBarItem, SideBarItemAvatarWrapper, SideBarItemMenu, SideBarItemTitle, SideBarListItem } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

type CondensedProps = {
	title: string;
	titleIcon?: ReactElement;
	avatar: ReactElement | boolean;
	icon?: IconName;
	actions?: ReactElement;
	href?: string;
	unread?: boolean;
	menu?: () => ReactElement;
	menuOptions?: any;
	selected?: boolean;
	badges?: ReactElement;
	clickable?: boolean;
};

const Condensed = ({ icon, title, avatar, actions, href, unread, menu, badges, ...props }: CondensedProps) => {
	console.log(props);
	return (
		<SideBarListItem>
			<SideBarItem href={href} {...props}>
				{avatar && <SideBarItemAvatarWrapper>{avatar}</SideBarItemAvatarWrapper>}
				{icon && icon}
				<SideBarItemTitle unread={unread}>{title}</SideBarItemTitle>
				{badges && badges}
				{actions && actions}
				{menu && <SideBarItemMenu>{menu()}</SideBarItemMenu>}
			</SideBarItem>
		</SideBarListItem>
	);
};

export default memo(Condensed);
