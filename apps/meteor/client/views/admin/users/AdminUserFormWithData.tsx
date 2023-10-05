import type { IUser } from '@rocket.chat/core-typings';
import { isUserFederated } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import AdminUserForm from './AdminUserForm';

type AdminUserFormWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const AdminUserFormWithData = ({ uid, onReload }: AdminUserFormWithDataProps): ReactElement => {
	const t = useTranslation();
	const { data, isLoading, isError } = useUserInfoQuery({ userId: uid });

	if (isLoading) {
		return (
			<Box p={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError) {
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

	return <AdminUserForm userData={data?.user} onReload={onReload} />;
};

export default AdminUserFormWithData;
