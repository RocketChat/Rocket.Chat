import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../../../../client/components/Page';
import DeviceInfoWithData from './DeviceInfoWithData';
import DevicesTable from './DevicesTable';

const DeviceManagementPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const deviceId = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Device_Management')} />
				<Page.Content>
					<DevicesTable />
				</Page.Content>
			</Page>
			{context === 'info' && <DeviceInfoWithData deviceId={deviceId} />}
		</Page>
	);
};

export default DeviceManagementPage;
