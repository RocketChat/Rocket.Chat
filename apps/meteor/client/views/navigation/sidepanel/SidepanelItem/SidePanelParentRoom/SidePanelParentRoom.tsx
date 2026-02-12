import type { ISubscription } from '@rocket.chat/core-typings';
import { isPrivateRoom } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import SidePanelTag from '../SidePanelTag';
import SidePanelTagIcon from '../SidePanelTagIcon';

const SidePanelParentRoom = ({ subscription }: { subscription: ISubscription }) => {
	const icon = isPrivateRoom(subscription) ? 'hashtag-lock' : 'hashtag';
	const roomName = roomCoordinator.getRoomName(subscription?.t, subscription);

	return (
		<SidePanelTag>
			{icon && <SidePanelTagIcon icon={{ name: icon }} />}
			{roomName}
		</SidePanelTag>
	);
};

export default SidePanelParentRoom;
