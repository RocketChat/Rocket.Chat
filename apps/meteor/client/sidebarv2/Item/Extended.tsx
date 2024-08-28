import {
	SideBarListItem,
	SideBarItem,
	SideBarItemAvatarWrapper,
	SideBarItemCol,
	SideBarItemRow,
	SideBarItemTitle,
	SideBarItemTimestamp,
	SideBarItemContent,
	SideBarItemMenu,
} from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import React, { memo } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

type ExtendedProps = {
	icon?: IconName;
	title: string;
	avatar?: React.ReactNode | boolean;
	actions?: React.ReactNode;
	href?: string;
	time?: any;
	menu?: () => React.ReactNode;
	subtitle?: React.ReactNode;
	badges?: React.ReactNode;
	unread?: boolean;
	selected?: boolean;
	menuOptions?: any;
	titleIcon?: React.ReactNode;
	threadUnread?: boolean;
};

const Extended = ({
	icon,
	title,
	avatar,
	actions,
	href,
	time,
	menu,
	menuOptions: _menuOptions,
	subtitle = '',
	titleIcon: _titleIcon,
	badges,
	threadUnread: _threadUnread,
	unread,
	...props
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();

	console.log(icon);
	return (
		<SideBarListItem>
			<SideBarItem href={href} {...props}>
				{avatar && <SideBarItemAvatarWrapper>{avatar}</SideBarItemAvatarWrapper>}

				<SideBarItemCol>
					<SideBarItemRow>
						{icon && icon}
						<SideBarItemTitle unread={unread}>{title}</SideBarItemTitle>
						<SideBarItemTimestamp>{formatDate(time)}</SideBarItemTimestamp>
					</SideBarItemRow>

					<SideBarItemRow>
						<SideBarItemContent>{subtitle}</SideBarItemContent>
						{badges && badges}
						{actions && actions}
						{menu && <SideBarItemMenu>{menu()}</SideBarItemMenu>}
					</SideBarItemRow>
				</SideBarItemCol>
			</SideBarItem>
		</SideBarListItem>
	);
};

export default memo(Extended);
