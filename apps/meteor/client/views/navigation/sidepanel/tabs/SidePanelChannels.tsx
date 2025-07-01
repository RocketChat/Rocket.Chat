import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserSubscription, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDE_BAR_GROUPS, useRoomsListContext, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';
import { useChannelsChildrenList } from '../hooks/useChannelsChildrenList';

const SidePanelChannels = () => {
	const { parentRid } = useRoomsListContext();

	if (!parentRid) {
		throw Error('No parent room ID provided');
	}

	const subscription = useUserSubscription(parentRid);

	if (!subscription) {
		throw Error('No subscription found for the provided parent room ID');
	}

	const isDirectSubscription = subscription?.t === 'd';

	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();
	const rooms = useChannelsChildrenList(parentRid, unreadOnly);

	return (
		<SidePanel
			title={(isDirectSubscription ? username : subscription?.fname) || subscription.name}
			currentTab={isDirectSubscription ? SIDE_BAR_GROUPS.DIRECT_MESSAGES : SIDE_BAR_GROUPS.CHANNELS}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelChannels;
