import React from 'react';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import NewImportPage from './NewImportPage';

function NewImportRoute() {
	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <NewImportPage />;
}

export default NewImportRoute;
