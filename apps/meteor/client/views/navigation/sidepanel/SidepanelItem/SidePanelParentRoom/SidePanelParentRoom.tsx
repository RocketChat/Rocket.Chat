import type { ISubscription } from '@rocket.chat/core-typings';
import { isPrivateRoom } from '@rocket.chat/core-typings';
import { SidebarV2ItemTag } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import SidePanelTagIcon from '../SidePanelTagIcon';

const SidePanelParentRoom = ({ subscription }: { subscription: ISubscription }) => {
	const icon = isPrivateRoom(subscription) ? 'hashtag-lock' : 'hashtag';
	const roomName = roomCoordinator.getRoomName(subscription?.t, subscription);

	const buttonProps = useButtonPattern((e) => {
		e.preventDefault();
		roomCoordinator.openRouteLink(subscription.t, { ...subscription });
	});

	return (
		<SidebarV2ItemTag {...buttonProps}>
			{icon && <SidePanelTagIcon icon={{ name: icon }} />}
			{roomName}
		</SidebarV2ItemTag>
	);
};

export default SidePanelParentRoom;
