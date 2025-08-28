import {
	IconButton,
	SidebarV2Item,
	SidebarV2ItemAvatarWrapper,
	SidebarV2ItemCol,
	SidebarV2ItemContent,
	SidebarV2ItemMenu,
	SidebarV2ItemRow,
	SidebarV2ItemTimestamp,
	SidebarV2ItemTitle,
} from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { memo, useState } from 'react';

import { useShortTimeAgo } from '../../../../hooks/useTimeAgo';

type SidePanelItemProps = {
	href: string;
	selected: boolean;
	title: string;
	avatar: ReactNode;
	icon: ReactNode;
	unread: boolean;
	time?: Date;
	subtitle: ReactElement | null;
	parentRoom?: ReactNode;
	badges?: ReactElement;
	menu?: ReactElement;
};

const SidePanelItem = ({
	href,
	selected,
	title,
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
		<SidebarV2Item
			{...props}
			href={href}
			onClick={() => !selected && sidebar.toggle()}
			selected={selected}
			onFocus={handleFocus}
			onPointerEnter={handlePointerEnter}
			aria-label={title}
			aria-selected={selected}
			level={2}
		>
			<SidebarV2ItemCol>
				<SidebarV2ItemRow>
					{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
					{icon}
					<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
					{time && <SidebarV2ItemTimestamp unread={unread}>{formatDate(time)}</SidebarV2ItemTimestamp>}
				</SidebarV2ItemRow>
				<SidebarV2ItemRow>
					<SidebarV2ItemContent unread={unread}>{subtitle}</SidebarV2ItemContent>
					{parentRoom}
					{badges}
					{menu && (
						<SidebarV2ItemMenu>
							{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
						</SidebarV2ItemMenu>
					)}
				</SidebarV2ItemRow>
			</SidebarV2ItemCol>
		</SidebarV2Item>
	);
};

export default memo(SidePanelItem);
