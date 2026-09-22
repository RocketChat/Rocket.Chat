import {
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemCol,
	SidebarItemRow,
	SidebarItemTitle,
	SidebarItemTimestamp,
	SidebarItemContent,
	SidebarItemMenu,
	IconButton,
} from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';

export type ExtendedProps = {
	icon?: ReactNode;
	title: ReactNode;
	avatar?: ReactNode;
	actions?: ReactNode;
	href?: string;
	timeLabel?: string;
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
	timeLabel,
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
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarItem level={2} href={href} selected={selected} {...props} onFocus={mountNow} onPointerEnter={requestMount}>
			{avatar && <SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>}
			<SidebarItemCol>
				<SidebarItemRow>
					{icon}
					<SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>
					{timeLabel && <SidebarItemTimestamp>{timeLabel}</SidebarItemTimestamp>}
				</SidebarItemRow>
				<SidebarItemRow>
					<SidebarItemContent unread={unread}>{subtitle}</SidebarItemContent>
					{titleIcon}
					{badges}
					{actions}
					{menu && (
						<SidebarItemMenu>
							{menuVisibility ? (
								menu()
							) : (
								<IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' onPointerDown={mountNow} />
							)}
						</SidebarItemMenu>
					)}
				</SidebarItemRow>
			</SidebarItemCol>
		</SidebarItem>
	);
};

export default memo(Extended);
