import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../../../../client/components/Page';
import DeviceManagementTable from './DeviceManagementTable';

const DeviceManagementPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Device_Management')} />
			<Page.Content>
				<DeviceManagementTable />
			</Page.Content>
		</Page>
	);
};

export default DeviceManagementPage;
