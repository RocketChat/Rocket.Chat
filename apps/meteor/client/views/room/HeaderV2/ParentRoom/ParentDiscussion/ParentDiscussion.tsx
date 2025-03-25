import { isPrivateRoom } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import ParentRoomButton from '../ParentRoomButton';

type ParentDiscussionProps = {
	loading?: boolean;
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentDiscussion = ({ loading = false, room }: ParentDiscussionProps) => {
	const { t } = useTranslation();
	const roomName = roomCoordinator.getRoomName(room.t, room);
	const handleRedirect = (): void => roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room });
	const title = isPrivateRoom(room) ? t('Back_to__roomName__group', { roomName }) : t('Back_to__roomName__channel', { roomName });

	return <ParentRoomButton loading={loading} onClick={handleRedirect} title={title} />;
};

export default ParentDiscussion;
