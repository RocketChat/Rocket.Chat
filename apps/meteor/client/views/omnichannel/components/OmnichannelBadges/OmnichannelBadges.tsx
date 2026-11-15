import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { useOmnichannelPriorities } from '../../hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../priorities/PriorityIcon';
import RoomActivityIcon from '../RoomActivityIcon';

export type OmnichannelBadgesProps = { room: ISubscription & IRoom };

const OmnichannelBadges = ({ room }: OmnichannelBadgesProps) => {
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

export default OmnichannelBadges;
