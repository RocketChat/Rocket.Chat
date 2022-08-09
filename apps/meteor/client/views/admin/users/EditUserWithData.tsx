import { isUserFederated, IUser } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditUser from './EditUser';

type EditUserWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const EditUserWithData = ({ uid, onReload, ...props }: EditUserWithDataProps): ReactElement => {
	const t = useTranslation();
	const { value: roleData, phase: roleState, error: roleError } = useEndpointData('/v1/roles.list');
	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(
		'/v1/users.info',
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

	if (data?.user && isUserFederated({ federated: data?.user.federated })) {
		return (
			<Callout m='x16' type='danger'>
				{t('Edit_Federated_User_Not_Allowed')}
			</Callout>
		);
	}

	return <EditUser data={data?.user} roles={roleData?.roles} onReload={onReload} {...props} />;
};

export default EditUserWithData;
