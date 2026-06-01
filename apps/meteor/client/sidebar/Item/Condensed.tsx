import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';

type CondensedProps = {
	title: ReactNode;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon?: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => ReactNode;
	menuOptions?: any;
	selected?: boolean;
	badges?: ReactNode;
	clickable?: boolean;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const Condensed = ({ icon, title, avatar, actions, unread, menu, badges, ...props }: CondensedProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarV2Item title={title} {...props} onFocus={mountNow} onPointerEnter={requestMount}>
			{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
			{icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
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
		</SidebarV2Item>
	);
};

export default memo(Condensed);
