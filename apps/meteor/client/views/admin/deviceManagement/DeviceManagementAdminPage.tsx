import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import DeviceManagementAdminTable from './DeviceManagementAdminTable';
import DeviceManagementInfo from './DeviceManagementInfo';
import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const DeviceManagementAdminPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const deviceId = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Device_Management')} />
				<PageContent>
					<DeviceManagementAdminTable />
				</PageContent>
			</Page>
			{context === 'info' && deviceId && (
				<ContextualbarDialog onClose={() => router.navigate('/admin/device-management')}>
					<DeviceManagementInfo deviceId={deviceId} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default DeviceManagementAdminPage;
