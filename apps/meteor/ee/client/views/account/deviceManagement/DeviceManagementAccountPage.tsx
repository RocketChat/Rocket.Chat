import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../../../client/components/Page';
import DeviceManagementAccountTable from './DeviceManagementAccountTable';

const DeviceManagementAccountPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Manage_Devices')} />
			<Page.Content>
				<DeviceManagementAccountTable />
			</Page.Content>
		</Page>
	);
};

export default DeviceManagementAccountPage;
