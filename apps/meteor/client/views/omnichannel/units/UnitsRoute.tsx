import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import UnitsPage from './UnitsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const UnitsRoute = () => {
	const canViewUnits = usePermission('manage-livechat-units');
	const { data: isEnterprise = false } = useHasLicenseModule('livechat-enterprise');

	if (!(isEnterprise && canViewUnits)) {
		return <NotAuthorizedPage />;
	}

	return <UnitsPage />;
};

export default UnitsRoute;
