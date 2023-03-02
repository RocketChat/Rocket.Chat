import type { IRoom } from '@rocket.chat/core-typings';
import React, { useState } from 'react';

import EditRoomInfoWithData from './EditRoomInfo';
import RoomInfoWithData from './RoomInfo';

type RoomInfoRouterProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	onEnterRoom: () => void;
	resetState: () => void;
};

const RoomInfoRouter = ({ rid, onClickBack, onEnterRoom, resetState }: RoomInfoRouterProps) => {
	const [isEditing, setIsEditing] = useState(false);

	if (isEditing) {
		return <EditRoomInfoWithData rid={rid} onClickBack={() => setIsEditing(false)} />;
	}
	return (
		<RoomInfoWithData
			rid={rid}
			onClickBack={onClickBack}
			openEditing={() => setIsEditing(true)}
			onEnterRoom={onEnterRoom}
			resetState={resetState}
		/>
	);
};

export default RoomInfoRouter;
