import { IconButton, SideBarItem, SideBarItemAvatarWrapper, SideBarItemMenu, SideBarItemTitle } from '@rocket.chat/fuselage';
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

const Medium = ({ icon, title, avatar, actions, href, badges, unread, menu, ...props }: MediumProps) => {
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
			<SideBarItemAvatarWrapper>{avatar}</SideBarItemAvatarWrapper>
			{icon && icon}
			<SideBarItemTitle unread={unread}>{title}</SideBarItemTitle>
			{badges && badges}
			{actions && actions}
			{menu && (
				<SideBarItemMenu {...handleMenuEvent}>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' />}
				</SideBarItemMenu>
			)}
		</SideBarItem>
	);
};

export default memo(Medium);
