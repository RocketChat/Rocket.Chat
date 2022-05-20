import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AgentEdit from './AgentEdit';

type AgentEditWithDataProps = {
	uid: string;
	reload: () => void;
};

const AgentEditWithData: FC<AgentEditWithDataProps> = ({ uid, reload }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/users/agent/${uid}`);
	const {
		value: userDepartments,
		phase: userDepartmentsState,
		error: userDepartmentsError,
	} = useEndpointData(`livechat/agents/${uid}/departments`);
	const {
		value: availableDepartments,
		phase: availableDepartmentsState,
		error: availableDepartmentsError,
	} = useEndpointData('livechat/department');

	if (
		[state, availableDepartmentsState, userDepartmentsState].includes(AsyncStatePhase.LOADING) ||
		!userDepartments ||
		!availableDepartments
	) {
		return <FormSkeleton />;
	}

	if (error || userDepartmentsError || availableDepartmentsError || !data || !data.user) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	return <AgentEdit uid={uid} data={data} userDepartments={userDepartments} availableDepartments={availableDepartments} reset={reload} />;
};

export default AgentEditWithData;
