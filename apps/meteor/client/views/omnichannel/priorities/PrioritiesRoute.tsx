import { usePermission, useRouteParameter } from '@rocket.chat/ui-contexts';

import { PrioritiesPage } from './PrioritiesPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

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
