import { usePermission } from '@rocket.chat/ui-contexts';

import CustomFieldsPage from './CustomFieldsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const CustomFieldsRoute = () => {
	const canViewCustomFields = usePermission('view-livechat-customfields');

	if (!canViewCustomFields) {
		return <NotAuthorizedPage />;
	}

	return <CustomFieldsPage />;
};

export default CustomFieldsRoute;
