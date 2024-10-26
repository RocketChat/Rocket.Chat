import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ManagersTable from './ManagersTable';

const ManagersRoute = (): ReactElement => {
	const { t } = useTranslation();
	const canViewManagers = usePermission('manage-livechat-managers');

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Managers')} />
				<PageContent>
					<ManagersTable />
				</PageContent>
			</Page>
		</Page>
	);
};

export default ManagersRoute;
