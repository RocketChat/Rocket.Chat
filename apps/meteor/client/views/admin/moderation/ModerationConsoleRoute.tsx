import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ModerationConsolePage from './ModerationConsolePage';

const ModerationRoute = () => {
	const canViewModerationConsole = usePermission('view-moderation-console');

	if (!canViewModerationConsole) {
		return <NotAuthorizedPage />;
	}

	return <ModerationConsolePage />;
};
export default ModerationRoute;
