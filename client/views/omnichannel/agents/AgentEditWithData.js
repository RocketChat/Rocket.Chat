import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { useOmnichannelDepartments } from '../../../contexts/OmnichannelContext/OmnichannelDepartmentContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AgentEdit from './AgentEdit';

function AgentEditWithData({ uid, reload }) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/users/agent/${uid}`);
	const {
		value: userDepartments,
		phase: userDepartmentsState,
		error: userDepartmentsError,
	} = useEndpointData(`livechat/agents/${uid}/departments`);

	const availableDepartments = useOmnichannelDepartments();

	if ([state, userDepartmentsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || userDepartmentsError || !data || !data.user) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	return (
		<AgentEdit
			uid={uid}
			data={data}
			userDepartments={userDepartments}
			availableDepartments={availableDepartments}
			reset={reload}
		/>
	);
}

export default AgentEditWithData;
