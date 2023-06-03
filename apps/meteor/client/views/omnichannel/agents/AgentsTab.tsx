import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { Contextualbar, ContextualbarHeader, ContextualbarClose } from '../../../components/Contextualbar';
import AgentEditWithData from './AgentEditWithData';
import AgentInfo from './AgentInfo';
import AgentInfoActions from './AgentInfoActions';

const AgentsTab = ({ reload, context, id }: { reload: () => void; context: string; id: string }): ReactElement => {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');

	const handleContextualbarCloseButtonClick = useCallback((): void => {
		agentsRoute.push({});
	}, [agentsRoute]);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				{context === 'edit' && t('Edit_User')}
				{context === 'info' && t('User_Info')}
				<ContextualbarClose onClick={handleContextualbarCloseButtonClick} />
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
