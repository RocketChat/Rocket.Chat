import { isPrivateRoom } from '@rocket.chat/core-typings';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelTag from './SidePanelTag';
import SidePanelTagIcon from './SidePanelTagIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

const SidePanelParentDiscussion = ({ prid }: { prid: string }) => {
	const subscription = useUserSubscription(prid);

	if (!subscription) {
		throw new Error('No subscription was found');
	}

	const icon = isPrivateRoom(subscription) ? 'hashtag-lock' : 'hashtag';
	const roomName = roomCoordinator.getRoomName(subscription?.t, subscription);

	const buttonProps = useButtonPattern((e) => {
		e.preventDefault();
		roomCoordinator.openRouteLink(subscription.t, { ...subscription });
	});

	return (
		<SidePanelTag {...buttonProps}>
			{icon && <SidePanelTagIcon icon={{ name: icon }} />}
			{roomName}
		</SidePanelTag>
	);
};

export default SidePanelParentDiscussion;
