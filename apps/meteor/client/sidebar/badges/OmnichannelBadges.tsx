import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import React from 'react';

import { RoomActivityIcon } from '../../../ee/client/omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../ee/client/omnichannel/hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../../ee/client/omnichannel/priorities/PriorityIcon';

export const OmnichannelBadges = ({ room }: { room: ISubscription & IRoom }) => {
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	if (!isOmnichannelRoom(room)) {
		return null;
	}

	return (
		<>
			{isPriorityEnabled ? <PriorityIcon level={room.priorityWeight} /> : null}
			<RoomActivityIcon room={room} />
		</>
	);
};
