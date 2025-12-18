import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import MediaCallHistoryContextualbar from '../../../mediaCallHistory/MediaCallHistoryContextualbar';

const mediaCallHistoryRoute: RoomToolboxActionConfig = {
	id: 'media-call-history',
	title: 'Call_Information',
	tabComponent: MediaCallHistoryContextualbar,
	icon: 'info-circled',
	groups: ['direct'],
};

const coreRoomRoutes = [mediaCallHistoryRoute];

// This isn't really a proper hook, but it could be extended in the future
// So we're maitaning the same pattern as `useCoreRoomActions`
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	return coreRoomRoutes;
};
