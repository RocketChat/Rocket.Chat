import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useRef } from 'react';

import Page from '../../../../../client/components/Page';
import DeviceInfoWithData from './DeviceInfoWithData';
import DevicesTable from './DevicesTable';

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
					<DevicesTable reloadRef={reloadRef}/>
				</Page.Content>
			</Page>
			{context === 'info' && deviceId && <DeviceInfoWithData deviceId={deviceId} onReload={reloadRef.current}/>}
		</Page>
	);
};

export default DeviceManagementPage;
