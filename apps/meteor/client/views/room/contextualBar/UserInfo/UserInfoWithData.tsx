import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRolesDescription } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UserInfoActions from './UserInfoActions';
import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import { UserCardRole } from '../../../../components/UserCard';
import { UserInfo } from '../../../../components/UserInfo';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { ReactiveUserStatusText } from '../../../../components/UserStatusText';
import { usersQueryKeys } from '../../../../lib/queryKeys';
import { getUserEmailVerified } from '../../../../lib/utils/getUserEmailVerified';

export type UserInfoWithDataProps = {
	uid?: IUser['_id'];
	username?: IUser['username'];
	rid?: IRoom['_id'];
	invitationDate?: string;
	onClose: () => void;
	onClickBack?: () => void;
};

const UserInfoWithData = ({ uid, username, rid, invitationDate, onClose, onClickBack }: UserInfoWithDataProps) => {
	const { t } = useTranslation();
	const getRoles = useRolesDescription();

	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { isPending, isError, data } = useQuery({
		queryKey: usersQueryKeys.userInfo({ uid, username }),
		queryFn: () => {
			if (uid) return getUserInfo({ userId: uid });
			if (username) return getUserInfo({ username });
			throw new Error('userId or username is required');
		},
	});

	const user = useMemo(() => {
		if (!data?.user) {
			return;
		}

		const {
			_id,
			name,
			username,
			roles = [],
			bio,
			utcOffset,
			lastLogin,
			customFields,
			phone,
			phones,
			nickname,
			createdAt,
			canViewAllInfo,
			freeSwitchExtension,
		} = data.user;

		const phonesFallback = phone ? [{ number: phone }] : undefined;
		const normalizedPhones = phones ?? phonesFallback;

		return {
			_id,
			name,
			username,
			lastLogin,
			/**
			 * TODO: We shouldn't use UserCard components outside UserCard
			 */
			roles: roles && getRoles(roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
			bio,
			canViewAllInfo,
			phones: normalizedPhones,
			customFields,
			verified: getUserEmailVerified(data.user),
			email: getUserEmailAddress(data.user),
			utcOffset,
			createdAt,
			status: <ReactiveUserStatus uid={_id} />,
			customStatus: <ReactiveUserStatusText uid={_id} />,
			nickname,
			freeSwitchExtension,
		};
	}, [data, getRoles]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				{!onClickBack && <ContextualbarIcon name='user' />}
				<ContextualbarTitle>{t('User_Info')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>

			{isPending && (
				<ContextualbarContent>
					<FormSkeleton />
				</ContextualbarContent>
			)}

			{isError && !user && (
				<ContextualbarContent paddingBlock={16}>
					<Callout type='danger'>{t('User_not_found')}</Callout>
				</ContextualbarContent>
			)}

			{!isPending && user && (
				<UserInfo
					{...user}
					invitationDate={invitationDate}
					actions={rid ? <UserInfoActions user={user} rid={rid} isInvited={Boolean(invitationDate)} backToList={onClickBack} /> : null}
				/>
			)}
		</ContextualbarDialog>
	);
};

export default UserInfoWithData;
