import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo, useState } from 'react';

type MediumProps = {
	title: string;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon?: IconName;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => ReactNode;
	badges?: ReactNode;
	selected?: boolean;
	menuOptions?: any;
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Medium = ({ icon, title, avatar, actions, badges, unread, menu, ...props }: MediumProps) => {
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<SidebarV2Item {...props} onFocus={handleFocus} onPointerEnter={handlePointerEnter}>
			<SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>
			{icon && icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges && badges}
			{actions && actions}
			{menu && (
				<SidebarV2ItemMenu>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
				</SidebarV2ItemMenu>
			)}
		</SidebarV2Item>
	);
};

export default memo(Medium);
