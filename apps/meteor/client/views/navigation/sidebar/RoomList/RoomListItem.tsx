import type { ItemSize } from '@rocket.chat/fuselage';
import {
	IconButton,
	ITEM_MEDIA_SIZE,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useShortTimeAgo } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { AriaAttributes, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';

type RoomListItemIconProps =
	| {
			/** Room type icon or user status, shown before the title. */
			icon: ReactNode;
			/** What the icon conveys, such as "Private channel" or "Away". */
			iconLabel: string;
	  }
	| { icon?: undefined; iconLabel?: undefined };

export type RoomListItemProps = {
	'room': SubscriptionWithRoom;
	'title': string;
	/** `condensed` and `medium` render a single line; `extended` adds the time and the `subtitle` line. */
	'size'?: ItemSize;
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
	size = 'condensed',
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

	const isExtended = size === 'extended';

	const itemIcon = icon && <ItemIcon label={iconLabel}>{icon}</ItemIcon>;

	const itemTitle = (
		<ItemTitle>
			{href !== undefined ? (
				<ItemLink href={href} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
					{title}
				</ItemLink>
			) : (
				<ItemLink is='button' onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
					{title}
				</ItemLink>
			)}
		</ItemTitle>
	);

	return (
		<Item {...props} size={size} selected={selected} highlighted={highlighted} onFocus={mountNow} onPointerEnter={requestMount}>
			<ItemMedia>
				<RoomAvatar size={ITEM_MEDIA_SIZE[size]} room={{ ...room, _id: room.rid || room._id, type: room.t }} />
			</ItemMedia>
			{isExtended ? (
				<ItemContent>
					<ItemRow>
						{itemIcon}
						{itemTitle}
						{time && <ItemMeta>{formatDate(time)}</ItemMeta>}
					</ItemRow>
					<ItemRow>
						<ItemDescription>{subtitle}</ItemDescription>
						{titleIcon}
						{badges}
					</ItemRow>
				</ItemContent>
			) : (
				<>
					{itemIcon}
					<ItemContent>
						<ItemRow>
							{itemTitle}
							{titleIcon}
						</ItemRow>
					</ItemContent>
					{badges}
				</>
			)}
			{actions}
			{menu && (
				<ItemActions reveal='hover'>
					{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />}
				</ItemActions>
			)}
		</Item>
	);
};

export default memo(RoomListItem);
