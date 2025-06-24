import { Box, IconButton, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, SidepanelListItem, ToggleSwitch } from '@rocket.chat/fuselage';
import { useLayout, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import SidePanelNoResults from './SidePanelNoResults';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import { usePreventDefault } from '../../../sidebarv2/hooks/usePreventDefault';
import RoomSidepanelListWrapper from '../../room/Sidepanel/RoomSidepanelListWrapper';
import RoomSidepanelItem from '../../room/Sidepanel/SidepanelItem';
import { type SidePanelFiltersKeys, sidePanelFiltersConfig } from '../contexts/RoomsNavigationContext';

type SidePanelProps = {
	currentTab: SidePanelFiltersKeys;
	onlyUnreads: boolean;
	toggleOnlyUnreads: () => void;
	// TODO: This can also be of type ILivechatInquiryRecord[]
	rooms: SubscriptionWithRoom[];
};

const SidePanel = ({ currentTab, onlyUnreads, toggleOnlyUnreads, rooms }: SidePanelProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const unreadFieldId = useId();
	const parentRid = useOpenedRoom();
	const {
		isTablet,
		sidePanel: { closeSidePanel },
	} = useLayout();

	const secondLevelOpenedRoom = useSecondLevelOpenedRoom() ?? parentRid;

	usePreventDefault(ref);

	return (
		<Sidepanel role='tabpanel'>
			<SidepanelHeader>
				{isTablet && <IconButton icon='arrow-back' title={t('Back')} small onClick={closeSidePanel} />}
				<SidepanelHeaderTitle>{t(sidePanelFiltersConfig[currentTab].title)}</SidepanelHeaderTitle>
				<Box display='flex' alignItems='center'>
					<Box htmlFor={unreadFieldId} is='label' fontScale='c1' mie={8}>
						{t('Unread')}
					</Box>
					<ToggleSwitch id={unreadFieldId} defaultChecked={onlyUnreads} onChange={toggleOnlyUnreads} />
				</Box>
			</SidepanelHeader>
			<Box pb={8} h='full' ref={ref}>
				{rooms && rooms.length === 0 && <SidePanelNoResults currentTab={currentTab} onlyUnreads={onlyUnreads} />}
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={rooms.length}
						data={rooms}
						components={{ Item: SidepanelListItem, List: RoomSidepanelListWrapper }}
						itemContent={(_, data) => <RoomSidepanelItem openedRoom={secondLevelOpenedRoom} room={data} />}
					/>
				</VirtualizedScrollbars>
			</Box>
		</Sidepanel>
	);
};

export default memo(SidePanel);
