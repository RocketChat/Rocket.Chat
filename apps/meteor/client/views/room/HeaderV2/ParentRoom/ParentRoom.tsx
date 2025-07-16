import type { IRoom } from '@rocket.chat/core-typings';

import ParentDiscussion from './ParentDiscussion';
import ParentTeam from './ParentTeam';

const ParentRoom = ({ room }: { room: IRoom }) => {
	const parentRoomId = Boolean(room.prid || (room.teamId && !room.teamMain));

	if (!parentRoomId) {
		return null;
	}

	if (room.prid) {
		return <ParentDiscussion room={room} />;
	}

	if (room.teamId && !room.teamMain) {
		return <ParentTeam room={room} />;
	}
};

export default ParentRoom;
