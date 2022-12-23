import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import UserCard from '../../../../components/UserCard';
import UserInfo from '../../../../components/UserInfo';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../../lib/utils/getUserEmailVerified';
import UserInfoActions from './UserInfoActions';

type UserInfoWithDataProps = {
	uid: IUser['_id'];
	username?: IUser['username'];
	rid: IRoom['_id'];
	onClose: () => void;
	onClickBack: () => void;
};

const UserInfoWithData = ({ uid, username, rid, onClose, onClickBack }: UserInfoWithDataProps): ReactElement => {
	const t = useTranslation();
	const getRoles = useRolesDescription();

	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(
		'/v1/users.info',
		useMemo(() => ({ userId: uid, username }), [uid, username]),
	);

	const isLoading = state === AsyncStatePhase.LOADING;

	const user = useMemo(() => {
		if (!data?.user) {
			return;
		}

		const {
			_id,
			name,
			username,
			roles = [],
			statusText,
			bio,
			utcOffset,
			lastLogin,
			customFields,
			phone,
			nickname,
			createdAt,
			canViewAllInfo,
		} = data.user;

		return {
			_id,
			name,
			username,
			lastLogin,
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			canViewAllInfo,
			phone,
			customFields,
			verified: getUserEmailVerified(data.user),
			email: getUserEmailAddress(data.user),
			utcOffset,
			createdAt,
			status: <ReactiveUserStatus uid={_id} />,
			statusText,
			nickname,
		};
	}, [data, getRoles]);

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

			{error && !user && (
				<VerticalBar.Content pb='x16'>
					<Callout type='danger'>{t('User_not_found')}</Callout>
				</VerticalBar.Content>
			)}

			{!isLoading && user && (
				<UserInfo
					{...user}
					actions={<UserInfoActions user={{ _id: user?._id, username: user?.username }} rid={rid} backToList={onClickBack} />}
				/>
			)}
		</>
	);
};

export default UserInfoWithData;
