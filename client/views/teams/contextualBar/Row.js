import React, { memo } from 'react';

import BaseTeamChannels from './BaseTeamChannels';

function Row({ room, onClickView }) {
	if (!room) {
		return <BaseTeamChannels.Option.Skeleton />;
	}

	return <BaseTeamChannels.Option room={room} onClickView={onClickView} />;
}

export default memo(Row);
