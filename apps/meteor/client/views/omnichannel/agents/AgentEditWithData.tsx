import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AgentEdit from './AgentEdit';
import { ContextualbarSkeletonBody } from '../../../components/Contextualbar';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const AgentEditWithData = ({ uid }: { uid: ILivechatAgent['_id'] }): ReactElement => {
	const { t } = useTranslation();

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
		queryKey: omnichannelQueryKeys.agentDepartments(uid),
		queryFn: async () => getAgentDepartments(),
		refetchOnWindowFocus: false,
	});

	if (isPending || agentDepartmentsLoading || !agentDepartments) {
		return <ContextualbarSkeletonBody />;
	}

	if (error || agentsDepartmentsError || !data?.user) {
		return <Box p={16}>{t('User_not_found')}</Box>;
	}

	return <AgentEdit agentData={data.user} agentDepartments={agentDepartments.departments} />;
};

export default AgentEditWithData;
