import { IconButton, SideBarItem, SideBarItemAvatarWrapper, SideBarItemMenu, SideBarItemTitle } from '@rocket.chat/fuselage';
import { useEffectEvent, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import React, { memo, useState } from 'react';

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

export default memo(Condensed);
