import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import DeviceManagementAccountTable from './DeviceManagementAccountTable';

const DeviceManagementAccountPage = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Manage_Devices')} />
			<PageContent>
				<DeviceManagementAccountTable />
			</PageContent>
		</Page>
	);
};

export default DeviceManagementAccountPage;
