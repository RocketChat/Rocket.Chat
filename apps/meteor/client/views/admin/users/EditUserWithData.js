import { Box, Callout } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditUser from './EditUser';

function EditUserWithData({ uid, ...props }) {
	const t = useTranslation();
	const { value: roleData, phase: roleState, error: roleError } = useEndpointData('roles.list', '');
	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(
		'users.info',
		useMemo(() => ({ userId: uid }), [uid]),
	);

	if ([state, roleState].includes(AsyncStatePhase.LOADING)) {
		return (
			<Box p='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || roleError) {
		return (
			<Callout m='x16' type='danger'>
				{t('User_not_found')}
			</Callout>
		);
	}

	return <EditUser data={data.user} roles={roleData.roles} {...props} />;
}

export default EditUserWithData;
