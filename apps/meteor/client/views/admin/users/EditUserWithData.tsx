import type { IUser } from '@rocket.chat/core-typings';
import { isUserFederated } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import EditUser from './EditUser';

type EditUserWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const EditUserWithData = ({ uid, onReload, ...props }: EditUserWithDataProps): ReactElement => {
	const t = useTranslation();

	const getRoles = useEndpoint('GET', '/v1/roles.list');

	const dispatchToastMessage = useToastMessageDispatch();

	const query = useMemo(() => ({ userId: uid }), [uid]);

	const {
		data: roleData,
		isLoading: roleState,
		error: roleError,
	} = useQuery(
		['roles'],
		async () => {
			const roles = await getRoles();
			return roles;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const getUsersInfo = useEndpoint('GET', '/v1/users.info');

	const {
		data,
		isLoading: state,
		error,
	} = useQuery(['users', query, 'admin'], async () => {
		const usersInfo = await getUsersInfo(query);
		return usersInfo;
	});

	if (state || roleState) {
		return (
			<Box p={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || roleError) {
		return (
			<Callout m={16} type='danger'>
				{t('User_not_found')}
			</Callout>
		);
	}

	if (data?.user && isUserFederated(data?.user as unknown as IUser)) {
		return (
			<Callout m={16} type='danger'>
				{t('Edit_Federated_User_Not_Allowed')}
			</Callout>
		);
	}

	return <EditUser data={data?.user} roles={roleData?.roles} onReload={onReload} {...props} />;
};

export default EditUserWithData;
