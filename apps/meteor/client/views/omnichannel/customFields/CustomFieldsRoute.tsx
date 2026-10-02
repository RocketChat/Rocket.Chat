import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import CustomFieldsPage from './CustomFieldsPage';

const CustomFieldsRoute = () => {
	const canViewCustomFields = usePermission('view-livechat-customfields');

	if (!canViewCustomFields) {
		return <NotAuthorizedPage />;
	}

	return <CustomFieldsPage />;
};

export default CustomFieldsRoute;
