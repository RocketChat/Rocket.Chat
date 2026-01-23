import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo, useState } from 'react';

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
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<SidebarV2Item {...props} onFocus={handleFocus} onPointerEnter={handlePointerEnter}>
			{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
			{icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges}
			{actions}
			{menu && (
				<SidebarV2ItemMenu>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
				</SidebarV2ItemMenu>
			)}
		</SidebarV2Item>
	);
};

export default memo(Condensed);
