import { Button } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useAllPermissions, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import PageHeader from '../../components/Page/PageHeader';

const EDIT_LAYOUT_PERMISSIONS = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

const HomepageHeader = (): ReactElement => {
	const t = useTranslation();
	const title = useSetting('Layout_Home_Title', 'Home');
	const canEditLayout = useAllPermissions(EDIT_LAYOUT_PERMISSIONS);
	const settingsRoute = useRoute('admin-settings');

	return (
		<PageHeader title={title} data-qa-id='home-header'>
			{canEditLayout && (
				<Button icon='pencil' onClick={() => settingsRoute.push({ group: 'Layout' })}>
					{t('Customize')}
				</Button>
			)}
		</PageHeader>
	);
};

export default HomepageHeader;
