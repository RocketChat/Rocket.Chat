import {
	IconButton,
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemTimestamp,
	SidebarItemTitle,
} from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useState } from 'react';

import { useShortTimeAgo } from '../../../../hooks/useTimeAgo';

export type SidePanelItemProps = {
	href: string;
	selected: boolean;
	title: string;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon: ReactNode;
	unread: boolean;
	time?: Date;
	subtitle: ReactNode;
	parentRoom?: ReactNode;
	badges?: ReactNode;
	menu?: ReactNode;
};

const SidePanelItem = ({
	href,
	selected,
	title,
	titleIcon,
	avatar,
	icon,
	unread,
	time,
	subtitle,
	parentRoom,
	badges,
	menu,
	...props
}: SidePanelItemProps) => {
	const { sidebar } = useLayout();
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<SidebarItem
			{...props}
			href={href}
			onClick={() => !selected && sidebar.toggle()}
			selected={selected}
			onFocus={handleFocus}
			onPointerEnter={handlePointerEnter}
			aria-label={title}
			aria-current={selected ? 'page' : undefined}
			level={2}
		>
			<SidebarItemCol>
				<SidebarItemRow>
					{avatar && <SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>}
					{icon}
					<SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>
					{time && <SidebarItemTimestamp unread={unread}>{formatDate(time)}</SidebarItemTimestamp>}
				</SidebarItemRow>
				<SidebarItemRow>
					<SidebarItemContent unread={unread}>{subtitle}</SidebarItemContent>
					{parentRoom}
					{titleIcon}
					{badges}
					{menu && (
						<SidebarItemMenu>
							{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' />}
						</SidebarItemMenu>
					)}
				</SidebarItemRow>
			</SidebarItemCol>
		</SidebarItem>
	);
};

export default memo(SidePanelItem);
