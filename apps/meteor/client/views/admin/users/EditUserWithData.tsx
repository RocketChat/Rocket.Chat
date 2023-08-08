import type { IUser } from '@rocket.chat/core-typings';
import { isUserFederated } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import EditUser from './EditUser';

type EditUserWithDataProps = {
	userId: string;
	onReload: () => void;
	roleData: any;
	roleState: boolean;
	roleError: unknown;
	availableRoles: SelectOption[];
};

const EditUserWithData = ({
	userId,
	onReload,
	roleData,
	roleState,
	roleError,
	availableRoles,
	...props
}: EditUserWithDataProps): ReactElement => {
	const t = useTranslation();

	const { data, isLoading: state, error, isSuccess } = useUserInfoQuery({ userId });

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

	return (
		<EditUser userData={isSuccess ? data.user : {}} roles={roleData.roles} onReload={onReload} availableRoles={availableRoles} {...props} />
	);
};

export default EditUserWithData;
