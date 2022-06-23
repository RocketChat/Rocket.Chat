import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useRef } from 'react';

import Page from '../../../../../client/components/Page';
import DeviceManagementInfo from './DeviceManagementInfo';
import DeviceManagementAdminTable from './DeviceManagementTable';

const DeviceManagementPage = (): ReactElement => {
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

export default DeviceManagementPage;
