import { isUserFederated } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { ContextualbarContent } from '../../../components/Contextualbar';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import UserInfo from '../../../components/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import { getUserEmailVerified } from '../../../lib/utils/getUserEmailVerified';
import AdminUserInfoActions from './AdminUserInfoActions';

type AdminUserInfoWithDataProps = {
	uid: IUser['_id'];
	onReload: () => void;
};

const AdminUserInfoWithData = ({ uid, onReload }: AdminUserInfoWithDataProps): ReactElement => {
	const t = useTranslation();
	const getRoles = useRolesDescription();
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const getUsersInfo = useEndpoint('GET', '/v1/users.info');

	const query = useMemo(() => ({ userId: uid }), [uid]);

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, refetch } = useQuery(
		['users', query, 'admin'],
		async () => {
			const usersInfo = await getUsersInfo(query);
			return usersInfo;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const onChange = useMutableCallback(() => {
		onReload();
		refetch();
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
			roles: getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			canViewAllInfo,
			phone,
			utcOffset,
			customFields: {
				...data.user.customFields,
				...(approveManuallyUsers && !data.user.active && data.user.reason ? { Reason: data.user.reason } : undefined),
			},
			verified: getUserEmailVerified(data.user),
			email: getUserEmailAddress(data.user),
			createdAt,
			status: <UserStatus status={status} />,
			statusText,
			nickname,
		};
	}, [approveManuallyUsers, data, getRoles]);

	if (isLoading) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	if (error || !user || !data?.user) {
		return (
			<ContextualbarContent pb={16}>
				<Callout type='danger'>{t('User_not_found')}</Callout>
			</ContextualbarContent>
		);
	}

	return (
		<UserInfo
			{...user}
			actions={
				<AdminUserInfoActions
					isActive={data?.user.active}
					isAdmin={data?.user.roles.includes('admin')}
					userId={data?.user._id}
					username={user.username}
					isFederatedUser={isUserFederated(data?.user as unknown as IUser)}
					onChange={onChange}
					onReload={onReload}
				/>
			}
		/>
	);
};

export default AdminUserInfoWithData;
