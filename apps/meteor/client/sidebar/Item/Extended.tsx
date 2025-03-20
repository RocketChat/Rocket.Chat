import { Sidebar, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { memo, useState } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

type ExtendedProps = {
	icon?: IconName;
	title?: ReactNode;
	avatar?: ReactNode;
	actions?: ReactNode;
	href?: string;
	time?: any;
	menu?: () => ReactNode;
	subtitle?: ReactNode;
	badges?: ReactNode;
	unread?: boolean;
	selected?: boolean;
	menuOptions?: any;
	titleIcon?: ReactNode;
	threadUnread?: boolean;
};

const Extended = ({
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
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<Sidebar.Item
			selected={selected}
			highlighted={unread}
			{...props}
			{...({ href } as any)}
			clickable={!!href}
			onFocus={handleFocus}
			onPointerEnter={handlePointerEnter}
		>
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
							<Sidebar.Item.Menu>
								{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' />}
							</Sidebar.Item.Menu>
						)}
					</Sidebar.Item.Wrapper>
				</Sidebar.Item.Content>
			</Sidebar.Item.Content>
			{actions && (
				<Sidebar.Item.Container>
					<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>
				</Sidebar.Item.Container>
			)}
		</Sidebar.Item>
	);
};

export default memo(Extended);
