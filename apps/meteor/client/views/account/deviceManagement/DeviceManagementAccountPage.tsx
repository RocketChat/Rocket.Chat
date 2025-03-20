import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAccountTable from './DeviceManagementAccountTable';
import { Page, PageHeader, PageContent } from '../../../components/Page';

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
