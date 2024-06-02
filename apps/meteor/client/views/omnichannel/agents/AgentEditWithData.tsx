import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import AgentEdit from './AgentEdit';

const AgentEditWithData = ({ uid }: { uid: ILivechatAgent['_id'] }): ReactElement => {
	const t = useTranslation();

	const getAvailableDepartments = useEndpoint('GET', '/v1/livechat/department');
	const getAgentById = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: uid });
	const getAgentDepartments = useEndpoint('GET', '/v1/livechat/agents/:agentId/departments', { agentId: uid });

	const { data, isLoading, error } = useQuery(['livechat-getAgentById', uid], async () => getAgentById(), { refetchOnWindowFocus: false });

	const {
		data: agentDepartments,
		isLoading: agentDepartmentsLoading,
		error: agentsDepartmentsError,
	} = useQuery(['livechat-getAgentDepartments', uid], async () => getAgentDepartments(), { refetchOnWindowFocus: false });

	const {
		data: availableDepartments,
		isLoading: availableDepartmentsLoading,
		error: availableDepartmentsError,
	} = useQuery(['livechat-getAvailableDepartments'], async () => getAvailableDepartments({ showArchived: 'true' }));

	if (isLoading || availableDepartmentsLoading || agentDepartmentsLoading || !agentDepartments || !availableDepartments) {
		return <FormSkeleton />;
	}

	if (error || agentsDepartmentsError || availableDepartmentsError || !data?.user) {
		return <Box p={16}>{t('User_not_found')}</Box>;
	}

	return (
		<AgentEdit
			agentData={data.user}
			userDepartments={agentDepartments.departments}
			availableDepartments={availableDepartments.departments}
		/>
	);
};

export default AgentEditWithData;
