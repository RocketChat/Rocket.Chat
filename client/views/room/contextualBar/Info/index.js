import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useUserRoom } from '../../../../contexts/UserContext';
import EditRoomInfoWithData from './EditRoomInfo';
import RoomInfoWithData from './RoomInfo';

const RoomInfo = ({ rid, onClickBack, onEnterRoom, resetState }) => {
	const [editing, setEditing] = useState(false);
	const backToView = useMutableCallback(() => setEditing(false));
	const room = useUserRoom(rid);
	if (!room) {
		return null;
	}

	return editing ? (
		<EditRoomInfoWithData onClickBack={backToView} rid={rid} />
	) : (
		<RoomInfoWithData
			onClickBack={onClickBack}
			openEditing={setEditing}
			rid={rid}
			onEnterRoom={onEnterRoom}
			resetState={resetState}
		/>
	);
};

export default RoomInfo;
