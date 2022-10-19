import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import EditRolePageWithData from './EditRolePageWithData';

const PermissionsContextBar = (): ReactElement | null => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const router = useRoute('admin-permissions');

	const handleCloseVerticalBar = useMutableCallback(() => {
		router.push({});
	});

	return (
		(context && (
			<VerticalBar>
				<VerticalBar.Header>
					<VerticalBar.Text>{context === 'edit' ? t('Role_Editing') : t('New_role')}</VerticalBar.Text>
					<VerticalBar.Close onClick={handleCloseVerticalBar} />
				</VerticalBar.Header>
				<EditRolePageWithData roleId={_id} />
			</VerticalBar>
		)) ||
		null
	);
};

export default PermissionsContextBar;
