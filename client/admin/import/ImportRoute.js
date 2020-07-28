import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import ImportHistoryPage from './ImportHistoryPage';
import NewImportPage from './NewImportPage';
import PrepareImportPage from './PrepareImportPage';
import ImportProgressPage from './ImportProgressPage';

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
