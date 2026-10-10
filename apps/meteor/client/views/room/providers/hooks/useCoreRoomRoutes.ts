import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy } from 'react';

import MediaCallHistoryContextualbarRoom from '../../../mediaCallHistory/MediaCallHistoryContextualbarRoom';
import { useRoomTabsEnabled } from '../../RoomTabs/hooks/useRoomTabsEnabled';

const Threads = lazy(() => import('../../contextualBar/Threads'));

const mediaCallHistoryRoute: RoomToolboxActionConfig = {
	id: 'media-call-history',
	title: 'Call_Information',
	tabComponent: MediaCallHistoryContextualbarRoom,
	icon: 'info-circled',
	groups: ['direct'],
};

const threadRoute: RoomToolboxActionConfig = {
	id: 'thread',
	title: 'Threads',
	tabComponent: Threads,
	icon: 'thread',
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
};

const coreRoomRoutes = [mediaCallHistoryRoute];
const coreRoomRoutesWithThread = [mediaCallHistoryRoute, threadRoute];

/**
 * Contextual bars the room opens from a link rather than from a header button. With room tabs, threads are one
 * of them: the header's Threads button gives way to the tab, but a thread opened from a message still opens here.
 */
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	const roomTabsEnabled = useRoomTabsEnabled();

	return roomTabsEnabled ? coreRoomRoutesWithThread : coreRoomRoutes;
};
