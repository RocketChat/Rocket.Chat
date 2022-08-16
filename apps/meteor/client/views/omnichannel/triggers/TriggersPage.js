import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditTriggerPageContainer from './EditTriggerPageContainer';
import NewTriggerPage from './NewTriggerPage';
import TriggersTableContainer from './TriggersTableContainer';

const MonitorsPage = () => {
	const t = useTranslation();

	const canViewTriggers = usePermission('view-livechat-triggers');

	const router = useRoute('omnichannel-triggers');

	const reload = useRef(() => {});

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleAdd = useMutableCallback(() => {
		router.push({ context: 'new' });
	});

	const handleCloseVerticalBar = useMutableCallback(() => {
		router.push({});
	});

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Livechat_Triggers')}>
					<Button onClick={handleAdd}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<TriggersTableContainer reloadRef={reload} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						{t('Trigger')}
						<VerticalBar.Close onClick={handleCloseVerticalBar} />
					</VerticalBar.Header>
					<VerticalBar.ScrollableContent>
						{context === 'edit' && <EditTriggerPageContainer id={id} onSave={reload.current} />}
						{context === 'new' && <NewTriggerPage onSave={reload.current} />}
					</VerticalBar.ScrollableContent>
				</VerticalBar>
			)}
		</Page>
	);
};

export default MonitorsPage;
