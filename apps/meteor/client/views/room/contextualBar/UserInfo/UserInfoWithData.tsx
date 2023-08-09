import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
} from '../../../../components/Contextualbar';
import { FormSkeleton } from '../../../../components/Skeleton';
import UserCard from '../../../../components/UserCard';
import UserInfo from '../../../../components/UserInfo';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
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
	} = useEndpointData('/v1/users.info', { params: useMemo(() => ({ userId: uid, username }), [uid, username]) });

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
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				{!onClickBack && <ContextualbarIcon name='user' />}
				<ContextualbarTitle>{t('User_Info')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>

			{isLoading && (
				<ContextualbarContent>
					<FormSkeleton />
				</ContextualbarContent>
			)}

			{error && !user && (
				<ContextualbarContent pb={16}>
					<Callout type='danger'>{t('User_not_found')}</Callout>
				</ContextualbarContent>
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
