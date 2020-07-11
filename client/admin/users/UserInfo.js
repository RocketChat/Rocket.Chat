import React, { useMemo, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';


import { UserInfo } from '../../components/basic/UserInfo';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import * as UserStatus from '../../components/basic/UserStatus';
import UserCard from '../../components/basic/UserCard';
import { FormSkeleton } from './Skeleton';
import { UserInfoActions } from './UserInfoActions';


export function UserInfoWithData({ uid, username, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();
	const showRealNames = useSetting('UI_Use_Real_Name');

	const onChange = () => setCache(new Date());

	// TODO: remove cache. Is necessary for data invalidation
	const { data, state, error } = useEndpointDataExperimental('users.info', useMemo(() => ({ ...uid && { userId: uid }, ...username && { username } }), [uid, username, cache]));

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
		} = user;
		return {
			name: showRealNames ? name : username,
			username,
			lastLogin,
			roles: roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			utcOffset,
			createdAt: user.createdAt,
			// localTime: <LocalTime offset={utcOffset} />,
			status: UserStatus.getStatus(status),
			customStatus: statusText,
		};
	}, [data, showRealNames]);

	if (state === ENDPOINT_STATES.LOADING) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}


	return <UserInfo
		{...user}
		data={data.user}
		onChange={onChange}
		actions={data && data.user && <UserInfoActions isActive={data.user.active} isAdmin={data.user.roles.includes('admin')} _id={data.user._id} username={data.user.username} onChange={onChange}/>}
		{...props}
	/>;
}

// data.bio && data.bio.trim().length > 0 && (
// 	<MarkdownText withTruncatedText fontScale="s1" content={data.bio} />
// );
