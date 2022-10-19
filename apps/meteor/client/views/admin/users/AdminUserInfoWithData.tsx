import { IUser } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import UserInfo from '../../../components/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import VerticalBar from '../../../components/VerticalBar';
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
	const getRoles = useRolesDescription();
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

	if (state === AsyncStatePhase.LOADING) {
		return (
			<VerticalBar.Content>
				<FormSkeleton />
			</VerticalBar.Content>
		);
	}

	if (error || !user || !data?.user) {
		return (
			<VerticalBar.Content pb='x16'>
				<Callout type='danger'>{t('User_not_found')}</Callout>
			</VerticalBar.Content>
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
					isAFederatedUser={data?.user.federated}
					onChange={onChange}
					onReload={onReload}
				/>
			}
		/>
	);
};

export default AdminUserInfoWithData;
