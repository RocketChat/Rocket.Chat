import { IconButton, SidebarItem, SidebarItemAvatarWrapper, SidebarItemMenu, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';

export type MediumProps = {
	title: ReactNode;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon?: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => ReactNode;
	badges?: ReactNode;
	selected?: boolean;
	menuOptions?: any;
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Medium = ({ icon, title, titleIcon, avatar, actions, badges, unread, menu, ...props }: MediumProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarItem {...props} onFocus={mountNow} onPointerEnter={requestMount}>
			<SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>
			{icon}
			<SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>
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
		</SidebarItem>
	);
};

export default memo(Medium);
