import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useUserId } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidePanelOmnichannelBadges from './SidePanelOmnichannelBadges';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import type { LivechatInquiryLocalRecord } from '../../../../hooks/useLivechatInquiryStore';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { isIOsDevice } from '../../../../lib/utils/isIOsDevice';
import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';
import { normalizeNavigationMessage } from '../../lib/normalizeNavigationMessage';
import SidePanelItem from '../SidepanelItem';
import RoomMenu from '../SidepanelItem/RoomMenu';

type InquireSidePanelItemProps = {
	room: LivechatInquiryLocalRecord;
	openedRoom?: string;
};

const InquireSidePanelItem = ({ room, openedRoom, ...props }: InquireSidePanelItemProps) => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const highlighted = Boolean(room.alert);
	const { alert, rid, t: type } = room;

	const time = 'lastMessage' in room ? room.lastMessage?.ts : undefined;
	const message =
		room.lastMessage && `${room.lastMessage.u.name || room.lastMessage.u.username}: ${normalizeNavigationMessage(room.lastMessage, t)}`;
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = roomCoordinator.getRouteLink(room.t, room) || '';

	const badges = <>{isOmnichannelRoom(room) && <SidePanelOmnichannelBadges room={room} />}</>;

	const isQueued = room.status === 'queued';
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const menu =
		!isIOsDevice && !isAnonymous && (!isQueued || (isQueued && isPriorityEnabled)) ? (
			<RoomMenu
				alert={alert}
				rid={rid}
				roomOpen={rid === openedRoom}
				type={type}
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
			icon={
				room.source && (
					<SidebarItemIcon
						highlighted={highlighted}
						icon={<OmnichannelRoomIcon placement='sidebar' source={room.source} status={room.v.status} size='x20' />}
					/>
				)
			}
			unread={highlighted}
			time={time}
			subtitle={message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null}
			badges={badges}
			menu={menu}
			{...props}
		/>
	);
};

export default memo(InquireSidePanelItem);
