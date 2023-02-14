import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ImportHistoryPage from './ImportHistoryPage';
import ImportProgressPage from './ImportProgressPage';
import NewImportPage from './NewImportPage';
import PrepareImportPage from './PrepareImportPage';

function ImportHistoryRoute({ page }) {
	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	if (page === 'history') {
		return <ImportHistoryPage />;
	}

	if (page === 'new') {
		return <NewImportPage />;
	}

	if (page === 'prepare') {
		return <PrepareImportPage />;
	}

	if (page === 'progress') {
		return <ImportProgressPage />;
	}

	return null;
}

export default ImportHistoryRoute;
