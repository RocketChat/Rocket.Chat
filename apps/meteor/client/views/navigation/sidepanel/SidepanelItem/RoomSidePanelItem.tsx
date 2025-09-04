import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2ItemBadge, SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useUserId, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMenu from './RoomMenu';
import SidePanelParent from './SidePanelParent';
import SidePanelItem from './SidepanelItem';
import { RoomIcon } from '../../../../components/RoomIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { isIOsDevice } from '../../../../lib/utils/isIOsDevice';
import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';
import { useUnreadDisplay } from '../../../../sidebarv2/hooks/useUnreadDisplay';
import { getNavigationMessagePreview } from '../../lib/getNavigationMessagePreview';
import SidePanelOmnichannelBadges from '../omnichannel/SidePanelOmnichannelBadges';

type RoomSidePanelItemProps = {
	room: SubscriptionWithRoom;
	openedRoom?: string;
	isRoomFilter?: boolean;
};

const RoomSidePanelItem = ({ room, openedRoom, isRoomFilter, ...props }: RoomSidePanelItemProps) => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const { unreadTitle, unreadVariant, showUnread, highlightUnread: highlighted, unreadCount } = useUnreadDisplay(room);
	const { unread = 0, alert, rid, t: type, cl } = room;

	const time = 'lastMessage' in room ? room.lastMessage?.ts : undefined;
	const message = getNavigationMessagePreview(room, room.lastMessage, t);
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = roomCoordinator.getRouteLink(room.t, room) || '';

	const badges = (
		<>
			{isOmnichannelRoom(room) && <SidePanelOmnichannelBadges room={room} />}
			{showUnread && (
				<SidebarV2ItemBadge
					variant={unreadVariant}
					title={unreadTitle}
					role='status'
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</SidebarV2ItemBadge>
			)}
		</>
	);

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const parentRoomId = Boolean(room.prid || (room.teamId && !room.teamMain));

	const menu =
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
		) : undefined;

	return (
		<SidePanelItem
			href={href}
			selected={rid === openedRoom}
			title={title}
			avatar={<RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />}
			icon={<SidebarItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />}
			unread={highlighted}
			time={time}
			subtitle={message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null}
			parentRoom={!isRoomFilter && parentRoomId && <SidePanelParent room={room} />}
			badges={badges}
			menu={menu}
			{...props}
		/>
	);
};

export default memo(RoomSidePanelItem);
