import { usePermission, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { PrioritiesPage } from './PrioritiesPage';

const PrioritiesRoute = (): ReactElement => {
	const canViewPriorities = usePermission('manage-livechat-priorities');
	const context = useRouteParameter('context') as 'edit' | undefined;
	const id = useRouteParameter('id') || '';

	if (!canViewPriorities) {
		return <NotAuthorizedPage />;
	}

	return <PrioritiesPage priorityId={id} context={context} />;
};

export default PrioritiesRoute;
