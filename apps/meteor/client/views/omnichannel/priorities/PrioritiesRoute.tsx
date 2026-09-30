import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission, useRouteParameter } from '@rocket.chat/ui-contexts';

import { PrioritiesPage } from './PrioritiesPage';

const PrioritiesRoute = () => {
	const canViewPriorities = usePermission('manage-livechat-priorities');
	const context = useRouteParameter('context') as 'edit' | undefined;
	const id = useRouteParameter('id') || '';

	if (!canViewPriorities) {
		return <NotAuthorizedPage />;
	}

	return <PrioritiesPage priorityId={id} context={context} />;
};

export default PrioritiesRoute;
