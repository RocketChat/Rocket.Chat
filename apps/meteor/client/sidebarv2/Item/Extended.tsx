import {
	SidebarV2Item,
	SidebarV2ItemAvatarWrapper,
	SidebarV2ItemCol,
	SidebarV2ItemRow,
	SidebarV2ItemTitle,
	SidebarV2ItemTimestamp,
	SidebarV2ItemContent,
	SidebarV2ItemMenu,
	IconButton,
} from '@rocket.chat/fuselage';
import { useEffectEvent, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import React, { memo, useState } from 'react';

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
	selected,
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const isReduceMotionEnabled = usePrefersReducedMotion();

	const handleMenu = useEffectEvent((e) => {
		setMenuVisibility(e.target.offsetWidth > 0 && Boolean(menu));
	});
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: handleMenu,
	};

	return (
		<SidebarV2Item href={href} selected={selected}>
			{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}

			<SidebarV2ItemCol>
				<SidebarV2ItemRow>
					{icon && icon}
					<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
					{time && <SidebarV2ItemTimestamp>{formatDate(time)}</SidebarV2ItemTimestamp>}
				</SidebarV2ItemRow>

				<SidebarV2ItemRow>
					<SidebarV2ItemContent unread={unread}>{subtitle}</SidebarV2ItemContent>
					{badges && badges}
					{actions && actions}
					{menu && (
						<SidebarV2ItemMenu {...handleMenuEvent}>
							{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
						</SidebarV2ItemMenu>
					)}
				</SidebarV2ItemRow>
			</SidebarV2ItemCol>
		</SidebarV2Item>
	);
};

export default memo(Extended);
