import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';
import UnitsPage from './UnitsPage';

const UnitsRoute = () => {
	const canViewUnits = usePermission('manage-livechat-units');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	if (!(isEnterprise && canViewUnits)) {
		return <NotAuthorizedPage />;
	}

	return <UnitsPage />;
};

export default UnitsRoute;
