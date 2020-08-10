import React from 'react';

import { useRouteParameter } from '../../contexts/RouterContext';
import CustomFieldsPage from './CustomFieldsPage';
import NewCustomFieldsPage from './NewCustomFieldsPage';
import EditCustomFieldsPage from './EditCustomFieldsPage';


const CustomFieldsRouter = () => {
	const context = useRouteParameter('context');

	if (!context) {
		return <CustomFieldsPage />;
	}

	if (context === 'new') {
		return <NewCustomFieldsPage />;
	}

	if (context === 'edit') {
		return <EditCustomFieldsPage />;
	}

	return undefined;
};

export default CustomFieldsRouter;
