import React, { ReactElement } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useUserId } from '../../../contexts/UserContext';
import { usePresence } from '../../../hooks/usePresence';
import RoomHeader from './RoomHeader';

type DirectRoomHeaderProps = {
	room: IRoom;
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const DirectRoomHeader = ({ room, slots }: DirectRoomHeaderProps): ReactElement => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const directUserData = usePresence(directUserId);

	return <RoomHeader slots={slots} room={room} topic={directUserData?.statusText} />;
};

export default DirectRoomHeader;
