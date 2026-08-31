import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import MediaCallHistoryContextualbarRoom from '../../../mediaCallHistory/MediaCallHistoryContextualbarRoom';

const mediaCallHistoryRoute: RoomToolboxActionConfig = {
	id: 'media-call-history',
	title: 'Call_Information',
	tabComponent: MediaCallHistoryContextualbarRoom,
	icon: 'info-circled',
	groups: ['direct'],
};

const coreRoomRoutes = [mediaCallHistoryRoute];

// This isn't really a proper hook, but it could be extended in the future
// So we're maitaning the same pattern as `useCoreRoomActions`
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	return coreRoomRoutes;
};
