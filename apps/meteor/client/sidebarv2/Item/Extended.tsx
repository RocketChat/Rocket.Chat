import {
	SideBarItem,
	SideBarItemAvatarWrapper,
	SideBarItemCol,
	SideBarItemRow,
	SideBarItemTitle,
	SideBarItemTimestamp,
	SideBarItemContent,
	SideBarItemMenu,
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
	...props
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
					{menu && (
						<SideBarItemMenu {...handleMenuEvent}>
							{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' />}
						</SideBarItemMenu>
					)}
				</SideBarItemRow>
			</SideBarItemCol>
		</SideBarItem>
	);
};

export default memo(Extended);
