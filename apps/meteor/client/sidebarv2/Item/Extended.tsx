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
import type { Keys as IconName } from '@rocket.chat/icons';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo, useState } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';

type ExtendedProps = {
	icon?: IconName;
	title: string;
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
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

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
	...props
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<SidebarV2Item href={href} selected={selected} {...props} onFocus={handleFocus} onPointerEnter={handlePointerEnter}>
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
						<SidebarV2ItemMenu>
							{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
						</SidebarV2ItemMenu>
					)}
				</SidebarV2ItemRow>
			</SidebarV2ItemCol>
		</SidebarV2Item>
	);
};

export default memo(Extended);
