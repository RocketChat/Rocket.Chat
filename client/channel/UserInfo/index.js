import React, { useMemo, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { UserInfo } from '../../components/basic/UserInfo';
import {
	useEndpointDataExperimental,
	ENDPOINT_STATES,
} from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import * as UserStatus from '../../components/basic/UserStatus';
import UserCard from '../../components/UserCard/UserCard';
import { FormSkeleton } from '../../admin/users/Skeleton';
import VerticalBar from '../../components/basic/VerticalBar';
// import { UserInfoActions } from './UserInfoActions';

export const UserInfoWithData = React.memo(function UserInfoWithData({ uid, username, onClose, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();
	const showRealNames = useSetting('UI_Use_Real_Name');

	const onChange = () => setCache(new Date());

	// TODO: remove cache. Is necessary for data invalidation
	const { data, state, error } = useEndpointDataExperimental(
		'users.info',
		useMemo(
			() => ({ ...uid && { userId: uid }, ...username && { username } }),
			[uid, username, cache],
		),
	);

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
		return <FormSkeleton />;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}
	return <VerticalBar>
		<VerticalBar.Header>
			{t('User_Info')}
			{ onClose && <VerticalBar.Close onClick={onClose} />}
		</VerticalBar.Header>
		<UserInfo
			{...user}
			data={data.user}
			// onChange={onChange}
			{...props}
			p='x24'
		/>
	</VerticalBar>;
});

export default UserInfoWithData;
