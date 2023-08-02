import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo';
import TeamsInfoWithData from './TeamsInfoWithData';

const TeamsInfoWithRooms = () => {
	const [editing, setEditing] = useState(false);
	const onClickBack = useMutableCallback(() => setEditing(false));

	if (editing) {
		return <EditChannelWithData onClickBack={onClickBack} />;
	}

	return <TeamsInfoWithData openEditing={setEditing} />;
};

export default TeamsInfoWithRooms;
