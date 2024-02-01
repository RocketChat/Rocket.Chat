import React, { memo } from 'react';

import TeamsChannelItem from './TeamsChannelItem';

function Row({ room, mainRoom, onClickView, reload }) {
	if (!room) {
		return <TeamsChannelItem.Skeleton />;
	}

	return <TeamsChannelItem room={room} mainRoom={mainRoom} onClickView={() => onClickView(room)} reload={reload} />;
}

export default memo(Row);
