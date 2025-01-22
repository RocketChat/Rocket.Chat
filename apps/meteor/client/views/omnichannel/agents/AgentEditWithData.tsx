import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AgentEdit from './AgentEdit';
import { FormSkeleton } from '../../../components/Skeleton';

const AgentEditWithData = ({ uid }: { uid: ILivechatAgent['_id'] }): ReactElement => {
	const { t } = useTranslation();

	const getAvailableDepartments = useEndpoint('GET', '/v1/livechat/department');
	const getAgentById = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: uid });
	const getAgentDepartments = useEndpoint('GET', '/v1/livechat/agents/:agentId/departments', { agentId: uid });

	const { data, isPending, error } = useQuery({
		queryKey: ['livechat-getAgentById', uid],
		queryFn: async () => getAgentById(),
		refetchOnWindowFocus: false,
	});

	const {
		data: agentDepartments,
		isPending: agentDepartmentsLoading,
		error: agentsDepartmentsError,
	} = useQuery({
		queryKey: ['livechat-getAgentDepartments', uid],
		queryFn: async () => getAgentDepartments(),
		refetchOnWindowFocus: false,
	});

	const {
		data: availableDepartments,
		isPending: availableDepartmentsLoading,
		error: availableDepartmentsError,
	} = useQuery({
		queryKey: ['livechat-getAvailableDepartments'],
		queryFn: async () => getAvailableDepartments({ showArchived: 'true' }),
	});

	if (isPending || availableDepartmentsLoading || agentDepartmentsLoading || !agentDepartments || !availableDepartments) {
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
