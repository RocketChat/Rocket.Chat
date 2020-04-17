import React from 'react';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import ImportProgressPage from './ImportProgressPage';


function ImportProgressRoute() {
	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <ImportProgressPage />;
}

export default ImportProgressRoute;
