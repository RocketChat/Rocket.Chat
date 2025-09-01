import { isLivechatInquiryRecord, type ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { Box, IconButton, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, SidepanelListItem, ToggleSwitch } from '@rocket.chat/fuselage';
import { useLayout, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import SidePanelNoResults from './SidePanelNoResults';
import RoomSidePanelItem from './SidepanelItem/RoomSidePanelItem';
import SidepanelListWrapper from './SidepanelListWrapper';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';
import { useOpenedRoom } from '../../../lib/RoomManager';
import { usePreventDefault } from '../../../sidebarv2/hooks/usePreventDefault';
import { useIsRoomFilter, type AllGroupsKeys } from '../contexts/RoomsNavigationContext';
import InquireSidePanelItem from './omnichannel/InquireSidePanelItem';

type SidePanelProps = {
	title: string;
	currentTab: AllGroupsKeys;
	unreadOnly: boolean;
	toggleUnreadOnly: () => void;
	rooms: (SubscriptionWithRoom | ILivechatInquiryRecord)[];
};

const SidePanel = ({ title, currentTab, unreadOnly, toggleUnreadOnly, rooms }: SidePanelProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const unreadFieldId = useId();
	const openedRoom = useOpenedRoom();
	const {
		isTablet,
		sidePanel: { closeSidePanel },
	} = useLayout();
	const isRoomFilter = useIsRoomFilter();

	usePreventDefault(ref);

	return (
		<Sidepanel role='tabpanel' aria-label={t('Side_panel')}>
			<SidepanelHeader role='heading' aria-label={title}>
				<Box withTruncatedText display='flex' alignItems='center'>
					{isTablet && <IconButton mie={8} icon='arrow-back' title={t('Back')} small onClick={closeSidePanel} />}
					<SidepanelHeaderTitle>{title}</SidepanelHeaderTitle>
				</Box>
				<Box display='flex' alignItems='center'>
					<Box htmlFor={unreadFieldId} is='label' fontScale='c1' mie={8}>
						{t('Unread')}
					</Box>
					<ToggleSwitch id={unreadFieldId} checked={unreadOnly} onChange={toggleUnreadOnly} />
				</Box>
			</SidepanelHeader>
			<Box pb={8} h='full' ref={ref}>
				{rooms && rooms.length === 0 && <SidePanelNoResults currentTab={currentTab} />}
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={rooms.length}
						data={rooms}
						components={{ Item: SidepanelListItem, List: SidepanelListWrapper }}
						itemContent={(_, room) => {
							if (isLivechatInquiryRecord(room)) {
								return <InquireSidePanelItem openedRoom={openedRoom} room={room} />;
							}

							return <RoomSidePanelItem openedRoom={openedRoom} room={room} isRoomFilter={isRoomFilter} />;
						}}
					/>
				</VirtualizedScrollbars>
			</Box>
		</Sidepanel>
	);
};

export default memo(SidePanel);
