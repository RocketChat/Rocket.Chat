import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import EditChannelWithData from './EditRoomInfo';
import RoomInfo from './RoomInfo';

export default ({ rid }) => {
	const [editing, setEditing] = useState(false);
	const onClickBack = useMutableCallback(() => setEditing(false));
	return editing ? <EditChannelWithData onClickBack={onClickBack} rid={rid} /> : <RoomInfo openEditing={setEditing} rid={rid} />;
};
