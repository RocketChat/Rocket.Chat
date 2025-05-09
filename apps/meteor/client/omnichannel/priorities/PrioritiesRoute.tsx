import { usePermission, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { PrioritiesPage } from './PrioritiesPage';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

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
