import { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import UserInfo from '../../../components/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../lib/utils/getUserEmailVerified';
import AdminUserInfoActions from './AdminUserInfoActions';

type AdminUserInfoWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const AdminUserInfoWithData = ({ uid, onReload }: AdminUserInfoWithDataProps): ReactElement => {
	const t = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name');
	const getRoles = useRolesDescription();
	const isAdmin = useRole('admin');
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const {
		value: data,
		phase: state,
		error,
		reload: reloadUserInfo,
	} = useEndpointData(
		'/v1/users.info',
		useMemo(() => ({ userId: uid }), [uid]),
	);

	const onChange = useMutableCallback(() => {
		onReload();
		reloadUserInfo();
	});

	const user = useMemo(() => {
		if (!data?.user) {
			return;
		}

		const {
			avatarETag,
			name,
			username,
			phone,
			createdAt,
			roles = [],
			status,
			statusText,
			bio,
			utcOffset,
			lastLogin,
			nickname,
			canViewAllInfo,
		} = data.user;

		return {
			avatarETag,
			name,
			username,
			lastLogin,
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			canViewAllInfo,
			phone,
			utcOffset,
			customFields: {
				...data.user.customFields,
				...(approveManuallyUsers && data.user.active === false && data.user.reason && { Reason: data.user.reason }),
			},
			verified: data.user && getUserEmailVerified(data.user),
			email: getUserEmailAddress(data.user),
			createdAt,
			status: <UserStatus status={status} />,
			statusText,
			nickname,
		};
	}, [approveManuallyUsers, data, getRoles]);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box p='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || !data?.user) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	return (
		<UserInfo
			{...user}
			showRealNames={showRealNames}
			actions={
				<AdminUserInfoActions
					isActive={data.user.active}
					isAdmin={isAdmin}
					userId={data.user._id}
					username={data.user.username}
					onChange={onChange}
					onReload={onReload}
				/>
			}
		/>
	);
};

export default AdminUserInfoWithData;
