import React from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import NewRolePage from './NewRolePage';
import EditRolePage from './EditRolePage';

const PermissionsContextBar = () => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');

	const router = useRoute('admin-permissions');

	const handleVerticalBarCloseButton = useMutableCallback(() => {
		router.push({});
	});

	return (context && <VerticalBar className={'contextual-bar'}>
		<VerticalBar.Header>
			{context === 'new' && t('New_role')}
			{context === 'edit' && t('Role_Editing')}
			<VerticalBar.Close onClick={handleVerticalBarCloseButton} />
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			{context === 'new' && <NewRolePage />}
			{context === 'edit' && <EditRolePage _id={_id} />}
		</VerticalBar.ScrollableContent>
	</VerticalBar>) || null;
};

export default PermissionsContextBar;
