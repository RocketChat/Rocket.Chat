import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import CustomFieldsPage from './CustomFieldsPage';

const CustomFieldsRoute = () => {
	const canViewCustomFields = usePermission('view-livechat-customfields');

	if (!canViewCustomFields) {
		return <NotAuthorizedPage />;
	}

	return <CustomFieldsPage />;
};

export default CustomFieldsRoute;
