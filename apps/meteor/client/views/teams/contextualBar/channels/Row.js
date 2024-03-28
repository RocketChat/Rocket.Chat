import React, { memo } from 'react';

import TeamsChannelItem from './TeamsChannelItem';

function Row({ room, mainRoomId, onClickView, reload }) {
	if (!room) {
		return <TeamsChannelItem.Skeleton />;
	}

	return <TeamsChannelItem room={room} mainRoomId={mainRoomId} onClickView={() => onClickView(room)} reload={reload} />;
}

export default memo(Row);
