import React, { useMemo, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';


import { FormSkeleton } from './Skeleton';
import { UserInfo } from './AgentInfo';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import * as UserStatus from '../../components/basic/UserStatus';

const AgentManagerEdit = function({ uid, username, reload, ...props }) {
	const t = useTranslation();

	const onChange = () => reload();

	// TODO: remove cache. Is necessary for data invalidation
	// livechat/agents/:agentId/departments
	const department = useEndpointDataExperimental(`livechat/agents/${ uid }/departments`);
	const { data, state } = useEndpointDataExperimental(`livechat/users/agent/${ uid }`);
	console.log(data, department);
	// const { data, error } = useEndpointDataExperimental('users.info', { userId: uid });

	const user = useMemo(() => {
		const { user } = data || { user: {} };
		const {
			username,
			status,
			statusLivechat,
		} = user;
		return {
			username,
			status: UserStatus.getStatus(status),
			statusLivechat,
		};
	}, [data]);

	if (state === 'LOADING') {
		return <FormSkeleton/>;
	}

	return <UserInfo
		state={state}
		{...user}
		data={data && data.user}
		onChange={onChange}
		{...props}
	/>;
};

export default AgentManagerEdit;
