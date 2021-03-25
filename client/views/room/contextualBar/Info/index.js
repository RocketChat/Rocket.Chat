import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import EditChannelWithData from './EditRoomInfo';
import RoomInfo from './RoomInfo';

export default ({ rid, onClickBack, onEnterRoom }) => {
	const [editing, setEditing] = useState(false);
	const backToView = useMutableCallback(() => setEditing(false));
	return editing
		? <EditChannelWithData onClickBack={backToView} rid={rid} />
		: <RoomInfo onClickBack={onClickBack} openEditing={setEditing} rid={rid} onEnterRoom={onEnterRoom} />;
};
