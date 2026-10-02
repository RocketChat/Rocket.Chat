import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import SlaPage from './SlaPage';

const SlaRoute = () => {
	const canViewSlas = usePermission('manage-livechat-sla');

	if (!canViewSlas) {
		return <NotAuthorizedPage />;
	}

	return <SlaPage />;
};

export default SlaRoute;
