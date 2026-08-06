import { Box, IconButton, Sidepanel, SidepanelHeader, SidepanelHeaderTitle, ToggleSwitch } from '@rocket.chat/fuselage';
import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useId, useRef, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import SidePanelNoResults from './SidePanelNoResults';
import { SidePanelVirtualItem } from './SidePanelVirtualItem';
import SidepanelListWrapper from './SidepanelListWrapper';
import { useOpenedRoom } from '../../../lib/RoomManager';
import { useIsRoomFilter, type AllGroupsKeys } from '../contexts/RoomsNavigationContext';
import { usePreventDefault } from '../sidebar/hooks/usePreventDefault';

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

type SidePanelProps<R = any> = {
	title: string;
	currentTab: AllGroupsKeys;
	unreadOnly: boolean;
	toggleUnreadOnly: () => void;
	rooms: R[];
	ItemContentComponent: ComponentType<{
		room: R;
		openedRoom: ReturnType<typeof useOpenedRoom>;
		isRoomFilter: boolean;
	}>;
};

export const SidePanelInternal = ({ title, currentTab, unreadOnly, toggleUnreadOnly, rooms, ItemContentComponent }: SidePanelProps) => {
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
			<Box h='full' ref={ref}>
				{rooms?.length === 0 && <SidePanelNoResults currentTab={currentTab} />}
				<CustomVirtuaScrollbars>
					<div style={scrollViewportStyle}>
						<Virtualizer as={SidepanelListWrapper} item={SidePanelVirtualItem}>
							{rooms.map((room, index) => (
								<ItemContentComponent
									key={(room as { _id?: string; rid?: string })._id ?? (room as { _id?: string; rid?: string }).rid ?? index}
									room={room}
									openedRoom={openedRoom}
									isRoomFilter={isRoomFilter}
								/>
							))}
						</Virtualizer>
					</div>
				</CustomVirtuaScrollbars>
			</Box>
		</Sidepanel>
	);
};

export const createSidePanel =
	<R extends object>(
		ItemContentComponent: ComponentType<{ room: R; openedRoom: ReturnType<typeof useOpenedRoom>; isRoomFilter: boolean }>,
	) =>
	// eslint-disable-next-line react/no-multi-comp, react/display-name
	({ title, currentTab, unreadOnly, toggleUnreadOnly, rooms }: Omit<SidePanelProps<R>, 'ItemContentComponent'>) => (
		<SidePanelInternal
			title={title}
			currentTab={currentTab}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
			ItemContentComponent={ItemContentComponent}
		/>
	);
