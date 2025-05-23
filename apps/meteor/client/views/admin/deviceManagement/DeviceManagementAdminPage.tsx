import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAdminTable from './DeviceManagementAdminTable';
import DeviceManagementInfo from './DeviceManagementInfo';
import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const DeviceManagementAdminPage = (): ReactElement => {
	const { t } = useTranslation();
	const deviceManagementRouter = useRoute('device-management');

	const context = useRouteParameter('context');
	const deviceId = useRouteParameter('id');

	const reloadRef = useRef(() => null);
	const handleCloseContextualBar = useEffectEvent((): void => deviceManagementRouter.push({}));

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Device_Management')} />
				<PageContent>
					<DeviceManagementAdminTable reloadRef={reloadRef} />
				</PageContent>
			</Page>
			{context === 'info' && deviceId && (
				<ContextualbarDialog onClose={handleCloseContextualBar}>
					<DeviceManagementInfo deviceId={deviceId} onReload={reloadRef.current} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default DeviceManagementAdminPage;
