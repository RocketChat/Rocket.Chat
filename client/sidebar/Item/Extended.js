import { Sidebar, ActionButton } from '@rocket.chat/fuselage';
import { useMutableCallback, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { memo, useState } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

const Extended = ({
	icon,
	title = '',
	avatar,
	actions,
	href,
	time,
	menu,
	menuOptions,
	subtitle = '',
	titleIcon,
	badges,
	threadUnread,
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
		<Sidebar.Item
			aria-selected={selected}
			selected={selected}
			highlighted={unread}
			{...props}
			href={href}
			clickable={!!href}
		>
			{avatar && <Sidebar.Item.Avatar>{avatar}</Sidebar.Item.Avatar>}
			<Sidebar.Item.Content>
				<Sidebar.Item.Content>
					<Sidebar.Item.Wrapper>
						{icon}
						<Sidebar.Item.Title
							data-qa='sidebar-item-title'
							className={unread && 'rcx-sidebar-item--highlighted'}
						>
							{title}
						</Sidebar.Item.Title>
						{time && <Sidebar.Item.Time>{formatDate(time)}</Sidebar.Item.Time>}
					</Sidebar.Item.Wrapper>
				</Sidebar.Item.Content>
				<Sidebar.Item.Content>
					<Sidebar.Item.Wrapper>
						<Sidebar.Item.Subtitle
							tabIndex='-1'
							className={unread && 'rcx-sidebar-item--highlighted'}
						>
							{subtitle}
						</Sidebar.Item.Subtitle>
						<Sidebar.Item.Badge>{badges}</Sidebar.Item.Badge>
						{menu && (
							<Sidebar.Item.Menu {...handleMenuEvent}>
								{menuVisibility ? (
									menu()
								) : (
									<ActionButton square ghost mini rcx-sidebar-item__menu icon='kebab' />
								)}
							</Sidebar.Item.Menu>
						)}
					</Sidebar.Item.Wrapper>
				</Sidebar.Item.Content>
			</Sidebar.Item.Content>
			{actions && (
				<Sidebar.Item.Container>
					{<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>}
				</Sidebar.Item.Container>
			)}
		</Sidebar.Item>
	);
};

export default memo(Extended);
