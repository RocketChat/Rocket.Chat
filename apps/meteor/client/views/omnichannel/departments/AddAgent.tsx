import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction, ComponentProps } from 'react';
import React, { useState } from 'react';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

type AgentListType = ILivechatDepartmentAgents[];

type AddAgentListProps = ComponentProps<typeof Box> & {
	agentList: AgentListType;
	setAgentList: Dispatch<SetStateAction<AgentListType>>;
	setAgentsAdded: Dispatch<SetStateAction<{ agentId: string }[]>>;
};

function AddAgent({ agentList, setAgentsAdded, setAgentList, ...props }: AddAgentListProps) {
	const t = useTranslation();
	const [userId, setUserId] = useState('');
	const getAgent = useEndpointAction('GET', '/v1/livechat/users/agent/:_id', { keys: { _id: userId } });
	const dispatchToastMessage = useToastMessageDispatch();

	const handleAgent = useMutableCallback((e) => setUserId(e));

	const handleSave = useMutableCallback(async () => {
		if (!userId) {
			return;
		}
		const { user } = await getAgent();

		if (agentList.filter((e) => e.agentId === user._id).length === 0) {
			const newAgent = { ...user, agentId: user._id } as unknown as ILivechatDepartmentAgents;
			setAgentList([newAgent, ...agentList]);
			setUserId('');
			setAgentsAdded((agents) => [...agents, { agentId: user._id }]); // Search the real type of setAgentsAdded and type the function on the root props
		} else {
			dispatchToastMessage({ type: 'error', message: t('This_agent_was_already_selected') });
		}
	});
	return (
		<Box display='flex' alignItems='center' {...props}>
			<AutoCompleteAgent value={userId} onChange={handleAgent} />
			<Button disabled={!userId} onClick={handleSave} mis='x8' primary>
				{t('Add')}
			</Button>
		</Box>
	);
}

export default AddAgent;
