import React, { memo } from 'react';

import TeamsChannelItem from './TeamsChannelItem';

function Row({ room, onClickView, reload }) {
	if (!room) {
		return <TeamsChannelItem.Skeleton />;
	}

	return <TeamsChannelItem room={room} onClickView={onClickView} reload={reload} />;
}

export default memo(Row);
