/* eslint-disable react/no-multi-comp */
import { SidePanel, SidePanelListItem } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../../components/CustomScrollbars';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import RoomSidePanelListWrapper from './RoomSidePanelListWrapper';
import RoomSidePanelLoading from './RoomSidePanelLoading';
import RoomSidePanelItem from './SidePanelItem';

const RoomSidePanel = () => {
	const parentRid = useOpenedRoom();
	const secondLevelOpenedRoom = useSecondLevelOpenedRoom() ?? parentRid;

	if (!parentRid || !secondLevelOpenedRoom) {
		return null;
	}

	return <RoomSidePanelWithData parentRid={parentRid} openedRoom={secondLevelOpenedRoom} />;
};

const RoomSidePanelWithData = ({ parentRid, openedRoom }: { parentRid: string; openedRoom: string }) => {
	const listRoomsAndDiscussions = useEndpoint('GET', '/v1/teams.listRoomsAndDiscussions');
	const result = useQuery(['room-list', parentRid], async () => listRoomsAndDiscussions({ roomId: parentRid }));
	const sidebarViewMode = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode') || 'extended';

	if (result.isLoading) {
		return <RoomSidePanelLoading />;
	}

	if (!result.isSuccess) {
		return null;
	}

	return (
		<SidePanel>
			<Virtuoso
				totalCount={result.data.data.length}
				data={result.data.data}
				components={{ Item: SidePanelListItem, List: RoomSidePanelListWrapper, Scroller: VirtuosoScrollbars }}
				itemContent={(_, data) => (
					<RoomSidePanelItem openedRoom={openedRoom} room={data} parentRid={parentRid} viewMode={sidebarViewMode} />
				)}
			/>
		</SidePanel>
	);
};

export default memo(RoomSidePanel);
