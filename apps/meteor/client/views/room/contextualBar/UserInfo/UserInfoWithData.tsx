import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useRolesDescription } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UserInfoActions from './UserInfoActions';
import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
} from '../../../../components/Contextualbar';
import { FormSkeleton } from '../../../../components/Skeleton';
import { UserCardRole } from '../../../../components/UserCard';
import { UserInfo } from '../../../../components/UserInfo';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { usersQueryKeys } from '../../../../lib/queryKeys';
import { getUserEmailVerified } from '../../../../lib/utils/getUserEmailVerified';

type UserInfoWithDataProps = {
	uid?: IUser['_id'];
	username?: IUser['username'];
	rid: IRoom['_id'];
	onClose: () => void;
	onClickBack?: () => void;
};

const UserInfoWithData = ({ uid, username, rid, onClose, onClickBack }: UserInfoWithDataProps): ReactElement => {
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
			roles: roles && getRoles(roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
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
				<ContextualbarContent pb={16}>
					<Callout type='danger'>{t('User_not_found')}</Callout>
				</ContextualbarContent>
			)}

			{!isPending && user && <UserInfo {...user} actions={<UserInfoActions user={user} rid={rid} backToList={onClickBack} />} />}
		</ContextualbarDialog>
	);
};

export default UserInfoWithData;
