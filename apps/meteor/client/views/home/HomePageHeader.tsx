import { Button } from '@rocket.chat/fuselage';
import { PageHeader } from '@rocket.chat/ui-client';
import { useSetting, useAllPermissions, useRoute, SETTINGS_MANAGEMENT_PERMISSIONS } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const HomepageHeader = () => {
	const { t } = useTranslation();
	const title = useSetting('Layout_Home_Title', 'Home');
	const canEditLayout = useAllPermissions(SETTINGS_MANAGEMENT_PERMISSIONS);
	const settingsRoute = useRoute('admin-settings');

	return (
		<PageHeader title={title}>
			{canEditLayout && (
				<Button icon='pencil' onClick={() => settingsRoute.push({ group: 'Layout' })}>
					{t('Customize')}
				</Button>
			)}
		</PageHeader>
	);
};

export default HomepageHeader;
