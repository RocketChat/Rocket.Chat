import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy } from 'react';

import { MemberListRouter } from '../..';
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

// Lets anyone who can see a message open its author's profile, even where the member list is hidden.
const userInfoRoute: RoomToolboxActionConfig = {
	id: 'user-info',
	title: 'User_Info',
	tabComponent: MemberListRouter,
	icon: 'user',
	groups: ['channel', 'group', 'team'],
};

const threadRoute: RoomToolboxActionConfig = {
	id: 'thread',
	title: 'Threads',
	tabComponent: Threads,
	icon: 'thread',
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
};

const coreRoomRoutes = [mediaCallHistoryRoute, userInfoRoute];
const coreRoomRoutesWithThread = [mediaCallHistoryRoute, userInfoRoute, threadRoute];

/**
 * Contextual bars the room opens from a link rather than from a header button. With room tabs, threads are one
 * of them: the header's Threads button gives way to the tab, but a thread opened from a message still opens here.
 */
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	const roomTabsEnabled = useRoomTabsEnabled();

	return roomTabsEnabled ? coreRoomRoutesWithThread : coreRoomRoutes;
};
