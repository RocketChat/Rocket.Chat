import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import DeviceManagementAccountTable from './DeviceManagementAccountTable';

const DeviceManagementAccountPage = () => {
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
