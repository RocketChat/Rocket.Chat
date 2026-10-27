import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import MediaCallHistoryContextualbarRoom from '../../../mediaCallHistory/MediaCallHistoryContextualbarRoom';
import { MemberListRouter } from '../..';

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

const coreRoomRoutes = [mediaCallHistoryRoute, userInfoRoute];

// This isn't really a proper hook, but it could be extended in the future
// So we're maitaning the same pattern as `useCoreRoomActions`
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	return coreRoomRoutes;
};
