import type { IRole, IUser } from '@rocket.chat/core-typings';
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
	context: string;
	roleData: { roles: IRole[] } | undefined;
	roleError: unknown;
};

const AdminUserFormWithData = ({ uid, onReload, context, roleData, roleError }: AdminUserFormWithDataProps): ReactElement => {
	const t = useTranslation();
	const { data, isLoading, isError, refetch } = useUserInfoQuery({ userId: uid });

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

	if (data?.user && isUserFederated(data?.user)) {
		return (
			<Callout m={16} type='danger'>
				{t('Edit_Federated_User_Not_Allowed')}
			</Callout>
		);
	}

	return (
		<AdminUserForm
			userData={data?.user}
			onReload={onReload}
			context={context}
			refetchUserFormData={() => {
				refetch();
			}}
			roleData={roleData}
			roleError={roleError}
		/>
	);
};

export default AdminUserFormWithData;
