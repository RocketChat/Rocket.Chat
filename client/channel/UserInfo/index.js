import React, { useMemo } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { UserInfo } from '../../components/basic/UserInfo';
import {
	useEndpointDataExperimental,
	ENDPOINT_STATES,
} from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import * as UserStatus from '../../components/basic/UserStatus';
import UserCard from '../../components/basic/UserCard';
import { FormSkeleton } from '../../admin/users/Skeleton';
import VerticalBar from '../../components/basic/VerticalBar';
import UserActions from './actions/UserActions';

export const UserInfoWithData = React.memo(function UserInfoWithData({ uid, username, tabBar, rid, onClose, video, showBackButton, ...props }) {
	const t = useTranslation();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const { data, state, error } = useEndpointDataExperimental(
		'users.info',
		useMemo(
			() => ({ ...uid && { userId: uid }, ...username && { username } }),
			[uid, username],
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
			nickname,
		} = user;
		return {
			name: showRealNames ? name : username,
			username,
			lastLogin,
			roles: roles.map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			phone: user.phone,
			customFields: user.customFields,
			email: user.emails?.find(({ address }) => !!address),
			utcOffset,
			createdAt: user.createdAt,
			// localTime: <LocalTime offset={utcOffset} />,
			status: UserStatus.getStatus(status),
			customStatus: statusText,
			nickname,
		};
	}, [data, showRealNames]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('User_Info')}
				{onClose && <VerticalBar.Close onClick={onClose} />}
			</VerticalBar.Header>

			{
				(error && <VerticalBar.Content>
					<Box mbs='x16'>{t('User_not_found')}</Box>
				</VerticalBar.Content>)
				|| (state === ENDPOINT_STATES.LOADING && <VerticalBar.Content>
					<FormSkeleton />
				</VerticalBar.Content>)
				|| <UserInfo
					{...user}
					data={data.user}
					// onChange={onChange}
					actions={<UserActions user={data.user} rid={rid}/>}
					{...props}
					p='x24'
				/>
			}
		</VerticalBar>
	);
});

export default UserInfoWithData;
