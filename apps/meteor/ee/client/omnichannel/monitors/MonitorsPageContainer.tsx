import React from 'react';

import PageSkeleton from '../../../../client/components/PageSkeleton';
import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import MonitorsPage from './MonitorsPage';

const MonitorsPageContainer = () => {
	const license = useHasLicenseModule('livechat-enterprise');

	if (license === 'loading') {
		return <PageSkeleton />;
	}

	if (!license) {
		return <NotAuthorizedPage />;
	}

	return <MonitorsPage />;
};

export default MonitorsPageContainer;
