import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import RoomActivityIcon from '../../views/omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../views/omnichannel/hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../views/omnichannel/priorities/PriorityIcon';

const OmnichannelBadges = ({ room }: { room: ISubscription & IRoom }) => {
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
