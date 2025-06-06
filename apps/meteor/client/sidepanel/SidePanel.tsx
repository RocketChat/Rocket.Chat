import { Box, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, SidepanelListItem, ToggleSwitch } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { memo, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { VirtualizedScrollbars } from '../components/CustomScrollbars';
import GenericNoResults from '../components/GenericNoResults';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../lib/RoomManager';
import { usePreventDefault } from '../sidebarv2/hooks/usePreventDefault';
import RoomSidepanelListWrapper from '../views/room/Sidepanel/RoomSidepanelListWrapper';
import RoomSidepanelItem from '../views/room/Sidepanel/SidepanelItem';

type SidePanelProps = {
	headerTitle: TranslationKey;
	onlyUnreads: boolean;
	toggleOnlyUnreads: () => void;
	// TODO: This can also be of type ILivechatInquiryRecord[]
	rooms: SubscriptionWithRoom[];
};

const SidePanel = ({ headerTitle, onlyUnreads, toggleOnlyUnreads, rooms }: SidePanelProps) => {
	const { t } = useTranslation();
	const ref = useRef(null);
	const unreadFieldId = useId();
	const parentRid = useOpenedRoom();
	const secondLevelOpenedRoom = useSecondLevelOpenedRoom() ?? parentRid;

	usePreventDefault(ref);

	return (
		<Sidepanel>
			<SidepanelHeader>
				<SidepanelHeaderTitle>{t(headerTitle)}</SidepanelHeaderTitle>
				<Box display='flex' alignItems='center'>
					<Box htmlFor={unreadFieldId} is='label' fontScale='c1' mie={8}>
						{t('Unread')}
					</Box>
					<ToggleSwitch id={unreadFieldId} defaultChecked={onlyUnreads} onChange={toggleOnlyUnreads} />
				</Box>
			</SidepanelHeader>
			<Box pb={8} h='full' ref={ref}>
				{rooms && rooms.length === 0 && <GenericNoResults />}
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={30}
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
