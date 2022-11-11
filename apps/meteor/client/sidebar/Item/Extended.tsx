import { Sidebar, IconButton, IconProps } from '@rocket.chat/fuselage';
import { useMutableCallback, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { memo, useState, VFC } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

type ExtendedProps = {
	icon?: IconProps['name'];
	title?: React.ReactNode;
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

const Extended: VFC<ExtendedProps> = ({
	icon,
	title = '',
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
	...props
}) => {
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const isReduceMotionEnabled = usePrefersReducedMotion();

	const handleMenu = useMutableCallback((e) => {
		setMenuVisibility(e.target.offsetWidth > 0 && Boolean(menu));
	});

	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: handleMenu,
	};

	return (
		<Sidebar.Item aria-selected={selected} selected={selected} highlighted={unread} {...props} {...({ href } as any)} clickable={!!href}>
			{avatar && <Sidebar.Item.Avatar>{avatar}</Sidebar.Item.Avatar>}
			<Sidebar.Item.Content>
				<Sidebar.Item.Content>
					<Sidebar.Item.Wrapper>
						{icon}
						<Sidebar.Item.Title data-qa='sidebar-item-title' className={(unread && 'rcx-sidebar-item--highlighted') as string}>
							{title}
						</Sidebar.Item.Title>
						{time && <Sidebar.Item.Time>{formatDate(time)}</Sidebar.Item.Time>}
					</Sidebar.Item.Wrapper>
				</Sidebar.Item.Content>
				<Sidebar.Item.Content>
					<Sidebar.Item.Wrapper>
						<Sidebar.Item.Subtitle className={(unread && 'rcx-sidebar-item--highlighted') as string}>{subtitle}</Sidebar.Item.Subtitle>
						<Sidebar.Item.Badge>{badges}</Sidebar.Item.Badge>
						{menu && (
							<Sidebar.Item.Menu {...handleMenuEvent}>
								{menuVisibility ? menu() : <IconButton mini rcx-sidebar-item__menu icon='kebab' />}
							</Sidebar.Item.Menu>
						)}
					</Sidebar.Item.Wrapper>
				</Sidebar.Item.Content>
			</Sidebar.Item.Content>
			{actions && <Sidebar.Item.Container>{<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>}</Sidebar.Item.Container>}
		</Sidebar.Item>
	);
};

export default memo(Extended);
