import type { IRoom } from '@rocket.chat/core-typings';

import ParentDiscussion from './ParentDiscussion';
import ParentTeam from './ParentTeam';

const ParentRoom = ({ room }: { room: IRoom }) => {
	if (room.prid) {
		return <ParentDiscussion room={room} />;
	}

	if (room.teamId && !room.teamMain) {
		return <ParentTeam room={room} />;
	}

	return null;
};

export default ParentRoom;
