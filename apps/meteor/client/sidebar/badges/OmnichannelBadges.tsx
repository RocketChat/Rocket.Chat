import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { RoomActivityIcon } from '../../omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../omnichannel/hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../omnichannel/priorities/PriorityIcon';

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
