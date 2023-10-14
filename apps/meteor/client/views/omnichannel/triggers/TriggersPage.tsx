import { Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useCallback } from 'react';

import { Contextualbar, ContextualbarTitle, ContextualbarHeader, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditTriggerPageContainer from './EditTriggerPageContainer';
import NewTriggerPage from './NewTriggerPage';
import TriggersTable from './TriggersTable';

const TriggersPage = () => {
	const t = useTranslation();
	const id = useRouteParameter('id');
	const context = useRouteParameter('context');
	const router = useRoute('omnichannel-triggers');
	const canViewTriggers = usePermission('view-livechat-triggers');

	const reload = useRef(() => null);

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	const handleAdd = useMutableCallback(() => {
		router.push({ context: 'new' });
	});

	const handleCloseContextualbar = useMutableCallback(() => {
		router.push({});
	});

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Livechat_Triggers')}>
					<Button onClick={handleAdd}>{t('Create_trigger')}</Button>
				</Page.Header>
				<Page.Content>
					<TriggersTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar>
					<ContextualbarHeader>
						<ContextualbarTitle>{t('Trigger')}</ContextualbarTitle>
						<ContextualbarClose onClick={handleCloseContextualbar} />
					</ContextualbarHeader>
					{context === 'edit' && <EditTriggerPageContainer key={id} id={id} onSave={handleReload} />}
					{context === 'new' && <NewTriggerPage onSave={handleReload} />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default TriggersPage;
