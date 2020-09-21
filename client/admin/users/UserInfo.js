import React, { useMemo } from 'react';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { UserInfo } from '../../components/basic/UserInfo';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import * as UserStatus from '../../components/basic/UserStatus';
import UserCard from '../../components/basic/UserCard';
import { UserInfoActions } from './UserInfoActions';
import { FormSkeleton } from './Skeleton';

export function UserInfoWithData({ uid, username, ...props }) {
	const t = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name');
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const { data, state, error, reload } = useEndpointDataExperimental('users.info', useMemo(() => ({ ...uid && { userId: uid }, ...username && { username } }), [uid, username]));

	const onChange = useMutableCallback(() => reload());

	const user = useMemo(() => {
		const { user } = data || { user: {} };
		const {
			name,
			username,
			roles = [],
			status,
			statusText,
			bio,
			utcOffset,
			lastLogin,
			nickname,
		} = user;
		return {
			name,
			username,
			lastLogin,
			showRealNames,
			roles: roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			phone: user.phone,
			utcOffset,
			customFields: { ...user.customFields, ...approveManuallyUsers && user.active === false && user.reason && { Reason: user.reason } },
			email: user.emails?.find(({ address }) => !!address),
			createdAt: user.createdAt,
			status: UserStatus.getStatus(status),
			customStatus: statusText,
			nickname,
		};
	}, [approveManuallyUsers, data, showRealNames]);

	if (state === ENDPOINT_STATES.LOADING) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	const admin = data.user?.roles?.includes('admin');

	return <UserInfo
		{...user}
		data={data.user}
		onChange={onChange}
		actions={data && data.user && <UserInfoActions isActive={data.user.active} isAdmin={admin} _id={data.user._id} username={data.user.username} onChange={onChange}/>}
		{...props}
	/>;
}
