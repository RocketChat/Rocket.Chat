import type { IRoom } from '@rocket.chat/core-typings';

import ParentDiscussion from './ParentDiscussion';
import ParentTeam from './ParentTeam';

export type ParentRoomProps = { room: IRoom };

const ParentRoom = ({ room }: ParentRoomProps) => {
	if (room.prid) {
		return <ParentDiscussion room={room} />;
	}

	if (room.teamId && !room.teamMain) {
		return <ParentTeam room={room} />;
	}

	return null;
};

export default ParentRoom;
