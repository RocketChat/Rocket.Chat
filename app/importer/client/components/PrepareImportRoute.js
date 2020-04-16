import React from 'react';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import PrepareImportPage from './PrepareImportPage';

function PrepareImportRoute() {
	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <PrepareImportPage />;
}

export default PrepareImportRoute;
