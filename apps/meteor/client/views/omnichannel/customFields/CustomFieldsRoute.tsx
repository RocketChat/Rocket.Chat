import { useRouteParameter, usePermission } from '@rocket.chat/ui-contexts';
import React, { useRef, useCallback } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import CustomFieldsPage from './CustomFieldsPage';
import EditCustomFieldsPage from './EditCustomFieldsPageContainer';
import NewCustomFieldsPage from './NewCustomFieldsPage';

const CustomFieldsRoute = () => {
	const reload = useRef(() => null);
	const canViewCustomFields = usePermission('view-livechat-customfields');
	const context = useRouteParameter('context');

	const handleReload = useCallback(() => {
		reload.current();
	}, [reload]);

	if (!canViewCustomFields) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <NewCustomFieldsPage reload={handleReload} />;
	}

	if (context === 'edit') {
		return <EditCustomFieldsPage reload={handleReload} />;
	}

	return <CustomFieldsPage reload={reload} />;
};

export default CustomFieldsRoute;
