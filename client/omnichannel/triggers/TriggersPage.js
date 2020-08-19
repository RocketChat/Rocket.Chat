import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersTable from './TriggersTable';
import EditTriggerPage from './EditTriggerPage';
import NewTriggerPage from './NewTriggerPage';
import Page from '../../components/basic/Page';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';

const MonitorsPage = () => {
	const t = useTranslation();

	const canViewTriggers = usePermission('view-livechat-triggers');

	const router = useRoute('omnichannel-triggers');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleAdd = useMutableCallback(() => {
		router.push({ context: 'new' });
	});

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	if (context === 'edit' && id) {
		return <EditTriggerPage id={id}/>;
	}

	if (context === 'new') {
		return <NewTriggerPage />;
	}

	return <Page>
		<Page.Header title={t('Livechat_Triggers')} >
			<Button small onClick={handleAdd}>
				<Icon name='plus' size='x16' />
			</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<TriggersTable />
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default MonitorsPage;
