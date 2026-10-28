import {
	IconButton,
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemLink,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemTimestamp,
	SidebarItemTitle,
} from '@rocket.chat/fuselage';
import { useDeferredMenuMount, useShortTimeAgo } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type SidePanelItemProps = {
	'href': string;
	'selected': boolean;
	'title': string;
	/**
	 * Names the room link; defaults to the title. Pass one that also tells about unread messages, as the sidebar does.
	 */
	'aria-label'?: string;
	'titleIcon'?: ReactNode;
	'avatar': ReactNode;
	'icon': ReactNode;
	'unread': boolean;
	'time'?: Date;
	'subtitle': ReactNode;
	'parentRoom'?: ReactNode;
	'badges'?: ReactNode;
	'menu'?: ReactNode;
};

const SidePanelItem = ({
	href,
	selected,
	title,
	'aria-label': ariaLabel = title,
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
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<SidebarItem {...props} is='div' selected={selected} onFocus={mountNow} onPointerEnter={requestMount} level={2}>
			<SidebarItemCol>
				<SidebarItemRow>
					{avatar && <SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>}
					{icon}
					<SidebarItemTitle unread={unread}>
						<SidebarItemLink
							href={href}
							onClick={() => !selected && sidebar.toggle()}
							aria-label={ariaLabel}
							aria-current={selected ? 'page' : undefined}
						>
							{title}
						</SidebarItemLink>
					</SidebarItemTitle>
					{time && <SidebarItemTimestamp unread={unread}>{formatDate(time)}</SidebarItemTimestamp>}
				</SidebarItemRow>
				<SidebarItemRow>
					<SidebarItemContent unread={unread}>{subtitle}</SidebarItemContent>
					{parentRoom}
					{titleIcon}
					{badges}
					{menu && (
						<SidebarItemMenu>
							{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />}
						</SidebarItemMenu>
					)}
				</SidebarItemRow>
			</SidebarItemCol>
		</SidebarItem>
	);
};

export default memo(SidePanelItem);
