import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import EditRolePage from './EditRolePageContainer';
import NewRolePage from './NewRolePage';

const PermissionsContextBar = () => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');

	const router = useRoute('admin-permissions');

	const handleVerticalBarCloseButton = useMutableCallback(() => {
		router.push({});
	});

	return (
		(context && (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'new' && t('New_role')}
					{context === 'edit' && t('Role_Editing')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButton} />
				</VerticalBar.Header>
				{context === 'new' && <NewRolePage />}
				{context === 'edit' && <EditRolePage _id={_id} />}
			</VerticalBar>
		)) ||
		null
	);
};

export default PermissionsContextBar;
