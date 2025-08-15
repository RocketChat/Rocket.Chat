import type { ISubscription } from '@rocket.chat/core-typings';

import { useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';
import { useChannelsChildrenList } from '../hooks/useChannelsChildrenList';

const SidePanelTeams = ({ parentRid, subscription }: { parentRid: string; subscription: ISubscription }) => {
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const rooms = useChannelsChildrenList(parentRid, unreadOnly, subscription?.teamId);

	return (
		<SidePanel
			title={subscription?.fname || subscription?.name}
			currentTab='teams'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelTeams;
