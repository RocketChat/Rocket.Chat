import React, { memo } from 'react';

import TeamsChannelItem from './TeamsChannelItem';

function Row({ room, mainRoom, onClickView, reload }) {
	if (!room) {
		return <TeamsChannelItem.Skeleton />;
	}

	return <TeamsChannelItem room={room} onClickView={() => onClickView(room)} reload={reload} mainRoom={mainRoom} />;
}

export default memo(Row);
