import { isPrivateRoom } from '@rocket.chat/core-typings';
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
	const handleRedirect = () => roomCoordinator.openRouteLink(subscription.t, { ...subscription });

	return (
		<SidePanelTag
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && handleRedirect()}
			onClick={(e) => {
				e.preventDefault();
				handleRedirect();
			}}
		>
			{icon && <SidePanelTagIcon icon={{ name: icon }} />}
			{roomName}
		</SidePanelTag>
	);
};

export default SidePanelParentDiscussion;
