import type { IRole, IUser, Serialized } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import AdminUserForm from './AdminUserForm';
import { FormSkeleton } from '../../../components/Skeleton';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';

export type AdminUserFormWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
	context: string;
	roleData: { roles: Serialized<Omit<IRole, '_updatedAt'>>[] } | undefined;
	roleError: Error | null;
};

const AdminUserFormWithData = ({ uid, onReload, context, roleData, roleError }: AdminUserFormWithDataProps) => {
	const { t } = useTranslation();
	const { data, isPending, isError, refetch } = useUserInfoQuery({ userId: uid });

	const handleReload = useStableCallback(() => {
		onReload();
		refetch();
	});

	if (isPending) {
		return (
			<Box padding={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError) {
		return (
			<Box padding={16}>
				<Callout type='danger'>{t('User_not_found')}</Callout>
			</Box>
		);
	}

	if (data?.user && !!data.user.federated) {
		return (
			<Box padding={16}>
				<Callout type='danger'>{t('Edit_Federated_User_Not_Allowed')}</Callout>
			</Box>
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
