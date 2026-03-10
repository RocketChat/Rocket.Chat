import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy } from 'react';

import MediaCallHistoryContextualbarRoom from '../../../mediaCallHistory/MediaCallHistoryContextualbarRoom';

const MedsenseDocumentationContextualBar = lazy(() => import('../../../medsense/documentation/DocumentationReviewContextualBar'));

const mediaCallHistoryRoute: RoomToolboxActionConfig = {
	id: 'media-call-history',
	title: 'Call_Information',
	tabComponent: MediaCallHistoryContextualbarRoom,
	icon: 'info-circled',
	groups: ['direct'],
};

const medsenseDocumentationRoute: RoomToolboxActionConfig = {
	id: 'medsense-documentation',
	title: 'Documentation',
	tabComponent: MedsenseDocumentationContextualBar,
	icon: 'document-eye',
};

const coreRoomRoutes = [mediaCallHistoryRoute, medsenseDocumentationRoute];

// This isn't really a proper hook, but it could be extended in the future
// So we're maitaning the same pattern as `useCoreRoomActions`
export const useCoreRoomRoutes = (): Array<RoomToolboxActionConfig> => {
	return coreRoomRoutes;
};
