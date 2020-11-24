import React, { useState } from 'react';

import EditChannelWithData from './EditChannel';
import RoomInfo from './RoomInfo';

export default ({ rid }) => {
	const [editing, setEditing] = useState(false);
	return editing ? <EditChannelWithData rid={rid} /> : <RoomInfo openEditing={setEditing} rid={rid} />;
};
