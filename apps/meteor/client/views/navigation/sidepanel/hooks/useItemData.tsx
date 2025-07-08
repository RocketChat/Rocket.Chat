import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2ItemBadge as SidebarItemBadge, SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useUserId, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../../components/RoomIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { isIOsDevice } from '../../../../lib/utils/isIOsDevice';
import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';
import { useUnreadDisplay } from '../../../../sidebarv2/hooks/useUnreadDisplay';
import { getNavigationMessagePreview } from '../../lib/getNavigationMessagePreview';
import RoomMenu from '../SidepanelItem/RoomMenu';

export const useItemData = (room: SubscriptionWithRoom, { openedRoom }: { openedRoom: string | undefined }) => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const { unreadTitle, unreadVariant, showUnread, highlightUnread: highlighted, unreadCount } = useUnreadDisplay(room);
	const { unread = 0, alert, rid, t: type, cl } = room;

	const icon = useMemo(
		() => <SidebarItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />,
		[highlighted, room],
	);
	const time = 'lastMessage' in room ? room.lastMessage?.ts : undefined;
	const message = getNavigationMessagePreview(room, room.lastMessage, t);
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = roomCoordinator.getRouteLink(room.t, room) || '';

	const badges = useMemo(
		() => (
			<>
				{showUnread && (
					<SidebarItemBadge variant={unreadVariant} title={unreadTitle} role='status'>
						<span aria-hidden>{unreadCount.total}</span>
					</SidebarItemBadge>
				)}
			</>
		),
		[showUnread, unreadCount.total, unreadTitle, unreadVariant],
	);

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const menu = useMemo(
		() =>
			!isIOsDevice && !isAnonymous && (!isQueued || (isQueued && isPriorityEnabled)) ? (
				<RoomMenu
					alert={alert}
					threadUnread={unreadCount.threads > 0}
					rid={rid}
					unread={!!unread}
					roomOpen={rid === openedRoom}
					type={type}
					cl={cl}
					name={title}
					hideDefaultOptions={isQueued}
					href={href || undefined}
				/>
			) : undefined,
		[alert, cl, isAnonymous, isPriorityEnabled, isQueued, openedRoom, rid, title, type, unread, unreadCount.threads, href],
	);

	const itemData = useMemo(
		() => ({
			unread: highlighted,
			selected: rid === openedRoom,
			href,
			title,
			icon,
			time,
			badges,
			avatar: <RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />,
			subtitle: message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null,
			menu,
		}),
		[badges, highlighted, icon, menu, message, openedRoom, rid, room, time, title, href],
	);

	return itemData;
};
