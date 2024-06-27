import { Tag } from '@rocket.chat/fuselage';
import React from 'react';

import { useUserHasRoomRole } from '../../hooks/useUserHasRoomRole';

type RoomOwnerProps = {
	roomId: string;
	userId: string;
};
function RoomOwnerTag({ roomId, userId }: RoomOwnerProps) {
	const isOwner = useUserHasRoomRole(userId, roomId, 'owner');
	return isOwner ? <Tag style={{ marginLeft: '4px' }}>Owner</Tag> : null;
}
export default RoomOwnerTag;
