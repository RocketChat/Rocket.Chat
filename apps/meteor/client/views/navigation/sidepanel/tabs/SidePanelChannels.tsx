import { isDirectMessageRoom, ISubscriptionDirectMessage } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserSubscription, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';
import { SIDE_BAR_GROUPS, useRoomsListContext, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import RoomSidepanelLoading from '../RoomSidepanelLoading';
import SidePanel from '../SidePanel';
import { useChannelsChildrenList } from '../hooks/useChannelsListChildren';

const SidePanelChannels = () => {
	const { parentRid } = useRoomsListContext();
	// const roomInfo = useRoomInfoEndpoint(parentRid);
	const subscription = useUserSubscription(parentRid);
	const isDirectSubscription = subscription?.t === 'd';

	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();
	const rooms = useChannelsChildrenList(parentRid, unreadOnly);

	return (
		<SidePanel
			title={isDirectSubscription ? username : subscription?.fname || subscription?.name}
			currentTab={isDirectSubscription ? SIDE_BAR_GROUPS.DIRECT_MESSAGES : SIDE_BAR_GROUPS.CHANNELS}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelChannels;
