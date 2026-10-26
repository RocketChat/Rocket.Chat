import {
	IconButton,
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemIcon,
	SidebarItemLink,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemTimestamp,
	SidebarItemTitle,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, RoomAvatar } from '@rocket.chat/ui-avatar';
import type { ItemMediaSizeName } from '@rocket.chat/ui-avatar';
import { useDeferredMenuMount, useShortTimeAgo } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { AriaAttributes, HTMLAttributes, MouseEventHandler, ReactElement, ReactNode } from 'react';
import { memo } from 'react';

export type RoomListItemViewMode = ItemMediaSizeName;

type RoomListItemIconProps =
	| {
			/** Room type icon or user status, shown before the title. */
			icon: ReactElement;
			/** What the icon conveys, such as "Private channel" or "Away". */
			iconLabel: string;
	  }
	| { icon?: undefined; iconLabel?: undefined };

export type RoomListItemProps = {
	'room': SubscriptionWithRoom;
	'title': string;
	/** `condensed` and `medium` render a single line; `extended` adds the time and the `subtitle` line. */
	'viewMode'?: RoomListItemViewMode;
	/** Shows the room avatar, as the `sidebarDisplayAvatar` preference allows. */
	'showAvatar'?: boolean;
	/** Navigates to the room. Without it, the title renders as a button that runs `onClick`. */
	'href'?: string;
	'onClick'?: MouseEventHandler<HTMLElement>;
	'subtitle'?: ReactNode;
	'time'?: Date | string;
	'titleIcon'?: ReactNode;
	'badges'?: ReactNode;
	'actions'?: ReactNode;
	'menu'?: ReactNode;
	'selected'?: boolean;
	'highlighted'?: boolean;
	'aria-label'?: string;
	'aria-current'?: AriaAttributes['aria-current'];
} & RoomListItemIconProps &
	Omit<HTMLAttributes<HTMLElement>, 'is' | 'title' | 'onClick' | 'aria-label' | 'aria-current'>;

const RoomListItem = ({
	room,
	title,
	viewMode = 'condensed',
	showAvatar = true,
	href,
	onClick,
	subtitle,
	time,
	icon,
	iconLabel,
	titleIcon,
	badges,
	actions,
	menu,
	selected,
	highlighted,
	'aria-label': ariaLabel,
	'aria-current': ariaCurrent,
	...props
}: RoomListItemProps) => {
	const formatDate = useShortTimeAgo();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	const isExtended = viewMode === 'extended';

	const itemIcon = icon && <SidebarItemIcon icon={icon} label={iconLabel} />;

	const itemTitle = (
		<SidebarItemTitle>
			{href !== undefined ? (
				<SidebarItemLink href={href} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
					{title}
				</SidebarItemLink>
			) : (
				<SidebarItemLink is='button' onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
					{title}
				</SidebarItemLink>
			)}
		</SidebarItemTitle>
	);

	const itemMenu = menu && (
		<SidebarItemMenu>
			{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />}
		</SidebarItemMenu>
	);

	return (
		<SidebarItem {...props} is='div' selected={selected} highlighted={highlighted} onFocus={mountNow} onPointerEnter={requestMount}>
			{showAvatar && (
				<SidebarItemAvatarWrapper>
					<RoomAvatar size={ITEM_MEDIA_SIZE[viewMode]} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
				</SidebarItemAvatarWrapper>
			)}
			{isExtended ? (
				<SidebarItemCol>
					<SidebarItemRow>
						{itemIcon}
						{itemTitle}
						{time && <SidebarItemTimestamp>{formatDate(time)}</SidebarItemTimestamp>}
					</SidebarItemRow>
					<SidebarItemRow>
						<SidebarItemContent>{subtitle}</SidebarItemContent>
						{titleIcon}
						{badges}
						{itemMenu}
						{actions}
					</SidebarItemRow>
				</SidebarItemCol>
			) : (
				<SidebarItemCol>
					<SidebarItemRow>
						{itemIcon}
						{itemTitle}
						{titleIcon}
						{badges}
						{itemMenu}
						{actions}
					</SidebarItemRow>
				</SidebarItemCol>
			)}
		</SidebarItem>
	);
};

export default memo(RoomListItem);
