import { Sidebar, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { VFC } from 'react';
import React, { memo, useState } from 'react';

type MediumProps = {
	title: React.ReactNode;
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

const Medium: VFC<MediumProps> = ({ icon, title = '', avatar, actions, href, badges, unread, menu, ...props }) => {
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const isReduceMotionEnabled = usePrefersReducedMotion();

	const handleMenu = useMutableCallback((e) => {
		setMenuVisibility(e.target.offsetWidth > 0 && Boolean(menu));
	});
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: handleMenu,
	};

	return (
		<Sidebar.Item {...props} {...({ href } as any)} clickable={!!href}>
			{avatar && <Sidebar.Item.Avatar>{avatar}</Sidebar.Item.Avatar>}
			<Sidebar.Item.Content>
				<Sidebar.Item.Wrapper>
					{icon}
					<Sidebar.Item.Title data-qa='sidebar-item-title' className={(unread && 'rcx-sidebar-item--highlighted') as string}>
						{title}
					</Sidebar.Item.Title>
				</Sidebar.Item.Wrapper>
				{badges && <Sidebar.Item.Badge>{badges}</Sidebar.Item.Badge>}
				{menu && (
					<Sidebar.Item.Menu {...handleMenuEvent}>
						{menuVisibility ? menu() : <IconButton mini rcx-sidebar-item__menu icon='kebab' />}
					</Sidebar.Item.Menu>
				)}
			</Sidebar.Item.Content>
			{actions && <Sidebar.Item.Container>{<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>}</Sidebar.Item.Container>}
		</Sidebar.Item>
	);
};

export default memo(Medium);
