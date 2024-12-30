import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AdminUserForm from './AdminUserForm';
import { isTruthy } from '../../../../lib/isTruthy';
import { FormSkeleton } from '../../../components/Skeleton';
import type { UserInfoQueryData } from '../../../hooks/useUserInfoQuery';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';

type AdminUserFormWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
	context: string;
	roleData: { roles: IRole[] } | undefined;
	roleError: unknown;
};

const filterUnavailableRoles = (availableRoles: IRole[] | undefined) => (data: UserInfoQueryData) => {
	if (!availableRoles) {
		return data;
	}
	return {
		...data,
		user: { ...data.user, roles: data.user.roles.filter((role: string) => isTruthy(availableRoles.find(({ _id }) => _id === role))) },
	};
};

const AdminUserFormWithData = ({ uid, onReload, context, roleData, roleError }: AdminUserFormWithDataProps): ReactElement => {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useUserInfoQuery({ userId: uid }, { select: filterUnavailableRoles(roleData?.roles) });

	const handleReload = useEffectEvent(() => {
		onReload();
		refetch();
	});

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

	if (data?.user && !!data.user.federated) {
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
			refetchUserFormData={handleReload}
			roleData={roleData}
			roleError={roleError}
		/>
	);
};

export default AdminUserFormWithData;
