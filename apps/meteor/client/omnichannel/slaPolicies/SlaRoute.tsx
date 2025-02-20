import { usePermission } from '@rocket.chat/ui-contexts';

import SlaPage from './SlaPage';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const SlaRoute = () => {
	const canViewSlas = usePermission('manage-livechat-sla');

	if (!canViewSlas) {
		return <NotAuthorizedPage />;
	}

	return <SlaPage />;
};

export default SlaRoute;
