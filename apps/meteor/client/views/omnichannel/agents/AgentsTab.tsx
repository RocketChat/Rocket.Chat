import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { Contextualbar, ContextualbarHeader, ContextualbarClose, ContextualbarTitle } from '../../../components/Contextualbar';
import AgentEditWithData from './AgentEditWithData';
import AgentInfo from './AgentInfo';
import AgentInfoActions from './AgentInfoActions';

type AgentsTabProps = {
	reload: () => void;
	context: string;
	id: string;
};

const AgentsTab = ({ reload, context, id }: AgentsTabProps): ReactElement => {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');

	const handleClose = useCallback((): void => {
		agentsRoute.push({});
	}, [agentsRoute]);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>
					{context === 'edit' && t('Edit_User')}
					{context === 'info' && t('User_Info')}
				</ContextualbarTitle>
				<ContextualbarClose onClick={handleClose} />
			</ContextualbarHeader>

			{context === 'edit' && <AgentEditWithData uid={id} reload={reload} />}
			{context === 'info' && (
				<AgentInfo uid={id}>
					<AgentInfoActions reload={reload} />
				</AgentInfo>
			)}
		</Contextualbar>
	);
};

export default AgentsTab;
