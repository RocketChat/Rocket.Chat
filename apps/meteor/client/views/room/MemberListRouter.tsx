import type { IRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';

import { useRoom } from './contexts/RoomContext';
import { useRoomToolbox } from './contexts/RoomToolboxContext';
import RoomMembers from './contextualBar/RoomMembers';
import UserInfo from './contextualBar/UserInfo';

const getUid = (room: IRoom, ownUserId: string | null) => {
	if (room.uids?.length === 1) {
		return room.uids[0];
	}

	const uid = room.uids?.filter((uid) => uid !== ownUserId).shift();

	// Self DMs used to be created with the userId duplicated.
	// Sometimes rooms can have 2 equal uids, but it's a self DM.
	return uid || room.uids?.[0];
};

const MemberListRouter = () => {
	const { tab, context: username } = useRoomToolbox();
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const ownUserId = useUserId();

	const isMembersList = tab?.id === 'members-list' || tab?.id === 'user-info-group';

	if (isMembersList && !username) {
		return <RoomMembers rid={room._id} />;
	}

	return <UserInfo {...(username ? { username } : { uid: getUid(room, ownUserId) })} onClose={closeTab} rid={room._id} />;
};

export default MemberListRouter;
