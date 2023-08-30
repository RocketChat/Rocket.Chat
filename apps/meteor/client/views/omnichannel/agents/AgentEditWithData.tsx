import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import AgentEdit from './AgentEdit';

type AgentEditWithDataProps = {
	uid: string;
	reload: () => void;
};

const AgentEditWithData = ({ uid, reload }: AgentEditWithDataProps): ReactElement => {
	const t = useTranslation();
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const getAgent = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: uid });

	const getAgentDepartments = useEndpoint('GET', '/v1/livechat/agents/:agentId/departments', { agentId: uid });

	const { data, isInitialLoading: isLoading, error } = useQuery(['getAgent'], async () => getAgent());
	const {
		data: userDepartments,
		isLoading: isUserDepartmentsLoading,
		error: userDepartmentsError,
	} = useQuery({ queryKey: ['getAgentDepartments'], queryFn: async () => getAgentDepartments(), cacheTime: 0 });

	const {
		data: availableDepartments,
		isLoading: isAvailableDepartmentsLoading,
		error: availableDepartmentsError,
	} = useQuery(['getDepartments'], async () => getDepartments({ showArchived: 'true' }));

	if (isLoading || isAvailableDepartmentsLoading || isUserDepartmentsLoading || !userDepartments || !availableDepartments) {
		return <FormSkeleton />;
	}

	if (error || userDepartmentsError || availableDepartmentsError || !data || !data.user) {
		return <Box p={16}>{t('User_not_found')}</Box>;
	}

	return <AgentEdit uid={uid} data={data} userDepartments={userDepartments} availableDepartments={availableDepartments} reset={reload} />;
};

export default AgentEditWithData;
