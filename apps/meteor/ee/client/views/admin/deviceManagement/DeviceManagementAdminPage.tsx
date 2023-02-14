import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import Page from '../../../../../client/components/Page';
import DeviceManagementAdminTable from './DeviceManagementAdminTable';
import DeviceManagementInfo from './DeviceManagementInfo';

const DeviceManagementAdminPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const deviceId = useRouteParameter('id');

	const reloadRef = useRef(() => null);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Device_Management')} />
				<Page.Content>
					<DeviceManagementAdminTable reloadRef={reloadRef} />
				</Page.Content>
			</Page>
			{context === 'info' && deviceId && <DeviceManagementInfo deviceId={deviceId} onReload={reloadRef.current} />}
		</Page>
	);
};

export default DeviceManagementAdminPage;
