import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import { useEffectEvent, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import React, { memo, useState } from 'react';

type MediumProps = {
	title: string;
	titleIcon?: React.ReactNode;
	avatar: React.ReactNode | boolean;
	icon?: IconName;
	actions?: React.ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => React.ReactNode;
	badges?: React.ReactNode;
	selected?: boolean;
	menuOptions?: any;
};

const Medium = ({ icon, title, avatar, actions, href, badges, unread, menu, selected }: MediumProps) => {
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
			<SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>
			{icon && icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges && badges}
			{actions && actions}
			{menu && (
				<SidebarV2ItemMenu {...handleMenuEvent}>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
				</SidebarV2ItemMenu>
			)}
		</SidebarV2Item>
	);
};

export default memo(Medium);
