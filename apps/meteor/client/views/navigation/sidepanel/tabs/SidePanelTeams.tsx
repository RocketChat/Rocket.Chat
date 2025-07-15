import type { ISubscription } from '@rocket.chat/core-typings';
import { type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDE_BAR_GROUPS, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';
import { useChannelsChildrenList } from '../hooks/useChannelsChildrenList';

const SidePanelTeams = ({ parentRid, subscription }: { parentRid: string; subscription: ISubscription }) => {
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const rooms = useChannelsChildrenList(parentRid, unreadOnly, subscription?.teamId);

	console.log('SidePanelTeams', { parentRid, subscription, unreadOnly, rooms });

	return (
		<SidePanel
			title={subscription?.fname || subscription?.name}
			currentTab={SIDE_BAR_GROUPS.TEAMS}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelTeams;
