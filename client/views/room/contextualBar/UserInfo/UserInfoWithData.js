import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import UserCard from '../../../../components/UserCard';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import { useRolesDescription } from '../../../../contexts/AuthorizationContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../../lib/getUserEmailVerified';
import UserInfo from './UserInfo';
import UserActions from './actions/UserActions';

function UserInfoWithData({
	uid,
	username,
	tabBar,
	rid,
	onClickClose,
	onClose = onClickClose,
	video,
	onClickBack,
	...props
}) {
	const t = useTranslation();

	const getRoles = useRolesDescription();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const {
		value,
		phase: state,
		error,
	} = useEndpointData(
		'users.info',
		useMemo(
			() => ({ ...(uid && { userId: uid }), ...(username && { username }) }),
			[uid, username],
		),
	);

	const user = useMemo(() => {
		const { user } = value || { user: {} };

		const {
			_id,
			name,
			username,
			roles = [],
			statusText,
			bio,
			utcOffset,
			lastLogin,
			nickname,
			canViewAllInfo,
		} = user;
		return {
			_id,
			name: showRealNames ? name : username,
			username,
			lastLogin,
			roles:
				roles &&
				getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			canViewAllInfo,
			phone: user.phone,
			customFields: user.customFields,
			verified: getUserEmailVerified(user),
			email: getUserEmailAddress(user),
			utcOffset,
			createdAt: user.createdAt,
			status: <ReactiveUserStatus uid={_id} />,
			customStatus: statusText,
			nickname,
		};
	}, [value, showRealNames, getRoles]);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('User_Info')}</VerticalBar.Text>
				{onClose && <VerticalBar.Close onClick={onClose} />}
			</VerticalBar.Header>

			{(error && (
				<VerticalBar.Content>
					<Box mbs='x16'>{t('User_not_found')}</Box>
				</VerticalBar.Content>
			)) ||
				(state === AsyncStatePhase.LOADING && (
					<VerticalBar.Content>
						<FormSkeleton />
					</VerticalBar.Content>
				)) || (
					<UserInfo
						{...user}
						data={user}
						actions={<UserActions user={user} rid={rid} backToList={onClickBack} />}
						{...props}
						p='x24'
					/>
				)}
		</>
	);
}

export default UserInfoWithData;
