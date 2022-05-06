import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import { UserStatus } from '../../../components/UserStatus';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../lib/utils/getUserEmailVerified';
import UserInfo from '../../room/contextualBar/UserInfo/UserInfo';
import { UserInfoActions } from './UserInfoActions';

export function UserInfoWithData({ uid, username, onReload, ...props }) {
	const t = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name');
	const getRoles = useRolesDescription();
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const {
		value: data,
		phase: state,
		error,
		reload: reloadUserInfo,
	} = useEndpointData(
		'users.info',
		useMemo(() => ({ ...(uid && { userId: uid }), ...(username && { username }) }), [uid, username]),
	);

	const onChange = useMutableCallback(() => {
		onReload();
		reloadUserInfo();
	});

	const user = useMemo(() => {
		const { user } = data || { user: {} };

		const { name, username, roles = [], status, statusText, bio, utcOffset, lastLogin, nickname } = user;

		return {
			name,
			username,
			lastLogin,
			showRealNames,
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			phone: user.phone,
			utcOffset,
			customFields: {
				...user.customFields,
				...(approveManuallyUsers && user.active === false && user.reason && { Reason: user.reason }),
			},
			verified: getUserEmailVerified(user),
			email: getUserEmailAddress(user),
			createdAt: user.createdAt,
			status: <UserStatus status={status} />,
			customStatus: statusText,
			nickname,
		};
	}, [approveManuallyUsers, data, showRealNames, getRoles]);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box p='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	const admin = data.user?.roles?.includes('admin');

	return (
		<UserInfo
			{...user}
			data={data.user}
			onChange={onChange}
			actions={
				data &&
				data.user && (
					<UserInfoActions
						isActive={data.user.active}
						isAdmin={admin}
						_id={data.user._id}
						username={data.user.username}
						onChange={onChange}
						onReload={onReload}
					/>
				)
			}
			{...props}
		/>
	);
}
