import { usePermission, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AgentEditWithData from './AgentEditWithData';
import AgentInfo from './AgentInfo';
import AgentsTable from './AgentsTable/AgentsTable';

const AgentsPage = (): ReactElement => {
	const t = useTranslation();
	const canViewAgents = usePermission('manage-livechat-agents');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (!canViewAgents) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Agents')} />
				<Page.Content>
					<AgentsTable />
				</Page.Content>
			</Page>
			{id && context === 'edit' && <AgentEditWithData uid={id} />}
			{id && context === 'info' && <AgentInfo uid={id} />}
		</Page>
	);
};

export default AgentsPage;
