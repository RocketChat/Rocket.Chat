import { Box, IconButton, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, SidepanelListItem, ToggleSwitch } from '@rocket.chat/fuselage';
import { useLayout, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import SidePanelNoResults from './SidePanelNoResults';
import RoomSidepanelItem from './SidepanelItem';
import SidepanelListWrapper from './SidepanelListWrapper';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';
import { useOpenedRoom } from '../../../lib/RoomManager';
import { usePreventDefault } from '../../../sidebarv2/hooks/usePreventDefault';
import type { AllGroupsKeys } from '../contexts/RoomsNavigationContext';

type SidePanelProps = {
	title: string;
	currentTab: AllGroupsKeys;
	unreadOnly: boolean;
	toggleOnlyUnreads: () => void;
	// TODO: This can also be of type ILivechatInquiryRecord[]
	rooms: SubscriptionWithRoom[];
};

const SidePanel = ({ title, currentTab, unreadOnly, toggleOnlyUnreads, rooms }: SidePanelProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const unreadFieldId = useId();
	const openedRoom = useOpenedRoom();
	const {
		isTablet,
		sidePanel: { closeSidePanel },
	} = useLayout();

	usePreventDefault(ref);

	return (
		<Sidepanel role='tabpanel'>
			<SidepanelHeader>
				{isTablet && <IconButton icon='arrow-back' title={t('Back')} small onClick={closeSidePanel} />}
				<SidepanelHeaderTitle>{title}</SidepanelHeaderTitle>
				<Box display='flex' alignItems='center'>
					<Box htmlFor={unreadFieldId} is='label' fontScale='c1' mie={8}>
						{t('Unread')}
					</Box>
					<ToggleSwitch id={unreadFieldId} defaultChecked={unreadOnly} onChange={toggleOnlyUnreads} />
				</Box>
			</SidepanelHeader>
			<Box pb={8} h='full' ref={ref}>
				{rooms && rooms.length === 0 && <SidePanelNoResults currentTab={currentTab} unreadOnly={unreadOnly} />}
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={rooms.length}
						data={rooms}
						components={{ Item: SidepanelListItem, List: SidepanelListWrapper }}
						itemContent={(_, data) => <RoomSidepanelItem openedRoom={openedRoom} room={data} />}
					/>
				</VirtualizedScrollbars>
			</Box>
		</Sidepanel>
	);
};

export default memo(SidePanel);
