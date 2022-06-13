import { Button, Icon } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useAllPermissions } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import PageHeader from '../../components/Page/PageHeader';

const editLayoutPermissions = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

const HomepageHeader = (): ReactElement => {
	const t = useTranslation();
	const title = useSetting('Layout_Home_Title') as string;
	const canEditLayout = useAllPermissions(editLayoutPermissions);
	return (
		<PageHeader title={title}>
			{canEditLayout && (
				<Button is='a' href='/admin/settings/Layout'>
					<>
						<Icon name='pencil' size='x16' /> {t('Customize')}
					</>
				</Button>
			)}
		</PageHeader>
	);
};

export default HomepageHeader;
