import { usePermission } from '@rocket.chat/ui-contexts';

import BackgroundJobsPage from './BackgroundJobsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const BackgroundJobsRoute = () => {
	const canManageBackgroundJobs = usePermission('manage-scheduled-jobs');

	if (!canManageBackgroundJobs) {
		return <NotAuthorizedPage />;
	}

	return <BackgroundJobsPage />;
};

export default BackgroundJobsRoute;
