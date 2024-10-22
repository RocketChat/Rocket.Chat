/* eslint-disable react/no-multi-comp */
import { Box, Sidepanel, SidepanelListItem } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../../components/CustomScrollbars';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import RoomSidepanelListWrapper from './RoomSidepanelListWrapper';
import RoomSidepanelLoading from './RoomSidepanelLoading';
import RoomSidepanelItem from './SidepanelItem';
import { useTeamsListChildrenUpdate } from './hooks/useTeamslistChildren';

const RoomSidepanel = () => {
	const parentRid = useOpenedRoom();
	const secondLevelOpenedRoom = useSecondLevelOpenedRoom() ?? parentRid;

	if (!parentRid || !secondLevelOpenedRoom) {
		return null;
	}

	return <RoomSidepanelWithData parentRid={parentRid} openedRoom={secondLevelOpenedRoom} />;
};

const RoomSidepanelWithData = ({ parentRid, openedRoom }: { parentRid: string; openedRoom: string }) => {
	const sidebarViewMode = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode');

	const roomInfo = useRoomInfoEndpoint(parentRid);
	const sidepanelItems = roomInfo.data?.room?.sidepanel?.items || roomInfo.data?.parent?.sidepanel?.items;

	const result = useTeamsListChildrenUpdate(
		parentRid,
		!roomInfo.data ? null : roomInfo.data.room?.teamId,
		// eslint-disable-next-line no-nested-ternary
		!sidepanelItems ? null : sidepanelItems?.length === 1 ? sidepanelItems[0] : undefined,
	);
	if (roomInfo.isSuccess && !roomInfo.data.room?.sidepanel && !roomInfo.data.parent?.sidepanel) {
		return null;
	}

	if (roomInfo.isLoading || (roomInfo.isSuccess && result.isLoading)) {
		return <RoomSidepanelLoading />;
	}

	if (!result.isSuccess || !roomInfo.isSuccess) {
		return null;
	}

	return (
		<Sidepanel>
			<Box pb={8} h='full'>
				<Virtuoso
					totalCount={result.data.length}
					data={result.data}
					components={{ Item: SidepanelListItem, List: RoomSidepanelListWrapper, Scroller: VirtuosoScrollbars }}
					itemContent={(_, data) => (
						<RoomSidepanelItem openedRoom={openedRoom} room={data} parentRid={parentRid} viewMode={sidebarViewMode} />
					)}
				/>
			</Box>
		</Sidepanel>
	);
};

export default memo(RoomSidepanel);
