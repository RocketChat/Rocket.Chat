/* eslint-disable react/no-multi-comp */

import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';
// import { useOpenedRoom, useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import { SIDE_BAR_GROUPS, useRoomsListContext, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import RoomSidepanelLoading from '../RoomSidepanelLoading';
import SidePanel from '../SidePanel';
import { useTeamsListChildrenUpdate } from '../hooks/useTeamslistChildren';

const SidePanelTeams = () => {
	const { parentRid } = useRoomsListContext();

	const roomInfo = useRoomInfoEndpoint(parentRid);
	const sidepanelItems = roomInfo.data?.room?.sidepanel?.items || roomInfo.data?.parent?.sidepanel?.items;

	// const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.MENTIONS);
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();

	const result = useTeamsListChildrenUpdate(
		parentRid,
		!roomInfo.data ? null : roomInfo.data.room?.teamId,
		// eslint-disable-next-line no-nested-ternary
		!sidepanelItems ? null : sidepanelItems?.length === 1 ? sidepanelItems[0] : undefined,
	);
	if (roomInfo.isSuccess && !roomInfo.data.room?.sidepanel && !roomInfo.data.parent?.sidepanel) {
		return null;
	}

	if (roomInfo.isLoading || (roomInfo.isSuccess && result.isPending)) {
		return <RoomSidepanelLoading />;
	}

	if (!result.isSuccess || !roomInfo.isSuccess) {
		return null;
	}

	return (
		<SidePanel
			title={roomInfo.data?.room?.name || roomInfo.data?.parent?.name}
			currentTab={SIDE_BAR_GROUPS.TEAMS}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={result.data as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelTeams;
