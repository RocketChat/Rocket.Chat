import { Box, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, SidepanelListItem, ToggleSwitch } from '@rocket.chat/fuselage';
// import { useUserPreference } from '@rocket.chat/ui-contexts';
import { memo, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

// import RoomSidepanelLoading from './RoomSidepanelLoading';
// import { useTeamsListChildrenUpdate } from './hooks/useTeamslistChildren';
import { VirtualizedScrollbars } from '../components/CustomScrollbars';
import GenericNoResults from '../components/GenericNoResults';
// import { useRoomInfoEndpoint } from '../hooks/useRoomInfoEndpoint';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../lib/RoomManager';
import { usePreventDefault } from '../sidebarv2/hooks/usePreventDefault';
import { useSidePanelRoomsList } from '../views/navigation/contexts/RoomsNavigationContext';
import RoomSidepanelListWrapper from '../views/room/Sidepanel/RoomSidepanelListWrapper';
import RoomSidepanelItem from '../views/room/Sidepanel/SidepanelItem';

const SidePanel = () => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const unreadFieldId = useId();
	const parentRid = useOpenedRoom();
	const secondLevelOpenedRoom = useSecondLevelOpenedRoom() ?? parentRid;

	const {
		roomList,
		currentFilter: { filter, onlyUnReads },
		setCurrentFilter,
	} = useSidePanelRoomsList();

	const rooms = roomList[filter] ?? [];

	usePreventDefault(ref);

	return (
		<Sidepanel>
			<SidepanelHeader>
				<SidepanelHeaderTitle>{t(filter)}</SidepanelHeaderTitle>
				<Box display='flex' alignItems='center'>
					<Box htmlFor={unreadFieldId} is='label' fontScale='c1' mie={8}>
						{t('Unread')}
					</Box>
					<ToggleSwitch
						id={unreadFieldId}
						defaultChecked={onlyUnReads}
						onChange={() => setCurrentFilter({ filter, onlyUnReads: !onlyUnReads })}
					/>
				</Box>
			</SidepanelHeader>
			<Box pb={8} h='full' ref={ref}>
				{rooms && rooms.length === 0 && <GenericNoResults />}
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={30}
						data={rooms}
						components={{ Item: SidepanelListItem, List: RoomSidepanelListWrapper }}
						itemContent={(_, data) => <RoomSidepanelItem openedRoom={secondLevelOpenedRoom} room={data} parentRid={parentRid} />}
					/>
				</VirtualizedScrollbars>
			</Box>
		</Sidepanel>
	);
};

export default memo(SidePanel);
