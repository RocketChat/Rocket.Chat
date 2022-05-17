import { Tabs } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';

import Page from '../../../../../client/components/Page';
import DevicesTable from './DevicesTable';

const DeviceManagementPage = (): ReactElement => {

	const t = useTranslation();
	const router = useRoute('device-management');
	const tab = useRouteParameter('tab');

	const goToDevices = useCallback(() => router.push({ tab: 'devices' }), [router]);
	const goToBlockedIPAddresses = useCallback(() => router.push({ tab: 'blocked-ip' }), [router]);

	return(
		<Page>
			<Page.Header title={t('Device_Management')} />
			<Tabs>
				<Tabs.Item selected={!tab || tab === 'devices'} onClick={goToDevices}>
					{t('Devices')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'blocked-ip'} onClick={goToBlockedIPAddresses}>
					{t('Blocked_IP_Addresses')}
				</Tabs.Item>
			</Tabs>
			<Page.Content>
				{(tab === 'devices' || !tab) && <DevicesTable />}
				{tab === 'blocked-ip' && <>Blocked IP Table</>}
			</Page.Content>
		</Page>
	);
};

export default DeviceManagementPage;
