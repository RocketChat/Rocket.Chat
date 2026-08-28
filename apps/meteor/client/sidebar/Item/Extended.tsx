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
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';
import { useShortTimeAgo } from '../../hooks/useTimeAgo';

export type ExtendedProps = {
	icon?: ReactNode;
	title: ReactNode;
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
	titleIcon,
	badges,
	threadUnread: _threadUnread,
	unread,
	selected,
	...props
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarV2Item level={2} href={href} selected={selected} {...props} onFocus={mountNow} onPointerEnter={requestMount}>
			<SidebarV2ItemCol>
				<SidebarV2ItemRow>
					{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
					{icon}
					<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
					{time && <SidebarV2ItemTimestamp unread={unread}>{formatDate(time)}</SidebarV2ItemTimestamp>}
				</SidebarV2ItemRow>
				<SidebarV2ItemRow>
					<SidebarV2ItemContent unread={unread}>{subtitle}</SidebarV2ItemContent>
					{titleIcon}
					{badges}
					{actions}
					{menu && (
						<SidebarV2ItemMenu>
							{menuVisibility ? (
								menu()
							) : (
								<IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' onPointerDown={mountNow} />
							)}
						</SidebarV2ItemMenu>
					)}
				</SidebarV2ItemRow>
			</SidebarV2ItemCol>
		</SidebarV2Item>
	);
};

export default memo(Extended);
