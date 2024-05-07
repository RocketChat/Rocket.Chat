import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
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
