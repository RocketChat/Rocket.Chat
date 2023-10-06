import { usePermission, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef, useCallback } from 'react';

import Page from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AgentsTab from './AgentsTab';
import AgentsTable from './AgentsTable/AgentsTable';

const AgentsPage = (): ReactElement => {
	const t = useTranslation();
	const reload = useRef(() => null);
	const canViewAgents = usePermission('manage-livechat-agents');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleReload = useCallback(() => {
		reload.current();
	}, [reload]);

	if (!canViewAgents) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Agents')} />
				<Page.Content>
					<AgentsTable reload={reload} />
				</Page.Content>
			</Page>
			{context && id && <AgentsTab reload={handleReload} context={context} id={id} />}
		</Page>
	);
};

export default AgentsPage;
