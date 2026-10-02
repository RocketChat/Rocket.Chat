import { useHasLicenseModule, NotAuthorizedPage } from '@rocket.chat/ui-client';

import MonitorsPage from './MonitorsPage';
import PageSkeleton from '../../../components/PageSkeleton';

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
