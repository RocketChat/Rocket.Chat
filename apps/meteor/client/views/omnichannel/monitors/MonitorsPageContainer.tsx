import { PageSkeleton, useHasLicenseModule } from '@rocket.chat/ui-client';

import MonitorsPage from './MonitorsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const MonitorsPageContainer = () => {
	const { isPending, data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (isPending) {
		return <PageSkeleton />;
	}

	if (!hasLicense) {
		return <NotAuthorizedPage />;
	}

	return <MonitorsPage />;
};

export default MonitorsPageContainer;
