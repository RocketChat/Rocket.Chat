import { useUserSubscription, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDE_BAR_GROUPS, useRoomsListContext, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';
import { useTeamsChildrenList } from '../hooks/useTeamsChildrenList';

const SidePanelTeams = () => {
	const { parentRid } = useRoomsListContext();

	if (!parentRid) {
		throw Error('No parent room ID provided');
	}

	const subscription = useUserSubscription(parentRid);

	if (!subscription) {
		throw Error('No subscription found for the provided parent room ID');
	}

	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();
	const rooms = useTeamsChildrenList(parentRid, unreadOnly, subscription?.teamId);

	return (
		<SidePanel
			title={subscription?.fname || subscription?.name}
			currentTab={SIDE_BAR_GROUPS.TEAMS}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelTeams;
