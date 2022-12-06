import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AgentEdit from './AgentEdit';

type AgentEditWithDataProps = {
	uid: string;
	reload: () => void;
};

const AgentEditWithData = ({ uid, reload }: AgentEditWithDataProps): ReactElement => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`/v1/livechat/users/agent/${uid}`);
	const {
		value: userDepartments,
		phase: userDepartmentsState,
		error: userDepartmentsError,
	} = useEndpointData(`/v1/livechat/agents/${uid}/departments`);
	const {
		value: availableDepartments,
		phase: availableDepartmentsState,
		error: availableDepartmentsError,
	} = useEndpointData('/v1/livechat/department');

	if (
		[state, availableDepartmentsState, userDepartmentsState].includes(AsyncStatePhase.LOADING) ||
		!userDepartments ||
		!availableDepartments
	) {
		return <FormSkeleton />;
	}

	if (error || userDepartmentsError || availableDepartmentsError || !data || !data.user) {
		return <Box p='x16'>{t('User_not_found')}</Box>;
	}

	return <AgentEdit uid={uid} data={data} userDepartments={userDepartments} availableDepartments={availableDepartments} reset={reload} />;
};

export default AgentEditWithData;
