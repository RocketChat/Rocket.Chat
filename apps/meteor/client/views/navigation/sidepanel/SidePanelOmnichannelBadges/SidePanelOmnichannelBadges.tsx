import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import SidePanelPriorityTag from './SidePanelPriorityTag';
import { RoomActivityIcon } from '../../../../omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';

const SidePanelOmnichannelBadges = ({ room }: { room: ISubscription & IRoom }) => {
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	if (!isOmnichannelRoom(room)) {
		return null;
	}

	return (
		<>
			{isPriorityEnabled ? <SidePanelPriorityTag priorityWeight={room.priorityWeight} /> : null}
			<RoomActivityIcon room={room} />
		</>
	);
};

export default SidePanelOmnichannelBadges;
