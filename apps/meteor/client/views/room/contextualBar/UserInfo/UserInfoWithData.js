import { Box } from '@rocket.chat/fuselage';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import UserCard from '../../../../components/UserCard';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../../lib/utils/getUserEmailVerified';
import UserInfo from './UserInfo';
import UserActions from './actions/UserActions';

function UserInfoWithData({ uid, username, tabBar, rid, onClickClose, onClose = onClickClose, video, onClickBack, ...props }) {
	const t = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name');
	const getRoles = useRolesDescription();

	const {
		value,
		phase: state,
		error,
	} = useEndpointData(
		'/v1/users.info',
		useMemo(() => ({ ...(uid && { userId: uid }), ...(username && { username }) }), [uid, username]),
	);

	const isLoading = state === AsyncStatePhase.LOADING;

	const user = useMemo(() => {
		const { user } = value || { user: {} };

		const { _id, name, username, roles = [], statusText, bio, utcOffset, lastLogin, nickname, canViewAllInfo } = user;

		return {
			_id,
			name,
			username,
			lastLogin,
			showRealNames,
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
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
				{!onClickBack && <VerticalBar.Icon name='user' />}
				<VerticalBar.Text>{t('User_Info')}</VerticalBar.Text>
				{onClose && <VerticalBar.Close onClick={onClose} />}
			</VerticalBar.Header>

			{isLoading && (
				<VerticalBar.Content>
					<FormSkeleton />
				</VerticalBar.Content>
			)}

			{error && (
				<VerticalBar.Content>
					<Box mbs='x16'>{t('User_not_found')}</Box>
				</VerticalBar.Content>
			)}

			{!isLoading && !error && (
				<UserInfo {...user} data={user} actions={<UserActions user={user} rid={rid} backToList={onClickBack} />} {...props} p='x24' />
			)}
		</>
	);
}

export default UserInfoWithData;
