import { usePermission } from '@rocket.chat/ui-contexts';

import UnitsPage from './UnitsPage';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const UnitsRoute = () => {
	const canViewUnits = usePermission('manage-livechat-units');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	if (!(isEnterprise && canViewUnits)) {
		return <NotAuthorizedPage />;
	}

	return <UnitsPage />;
};

export default UnitsRoute;
