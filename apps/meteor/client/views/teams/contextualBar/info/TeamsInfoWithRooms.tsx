import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import TeamsInfoWithData from './TeamsInfoWithData';
import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo';

const TeamsInfoWithRooms = () => {
	const [editing, setEditing] = useState(false);
	const onClickBack = useMutableCallback(() => setEditing(false));

	if (editing) {
		return <EditChannelWithData onClickBack={onClickBack} />;
	}

	return <TeamsInfoWithData openEditing={() => setEditing(true)} />;
};

export default TeamsInfoWithRooms;
