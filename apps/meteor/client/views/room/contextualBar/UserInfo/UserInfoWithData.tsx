import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import {
	ContextualbarBack,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	UserInfo,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UserInfoActions from './UserInfoActions';
import UserInfoWithRoles from './UserInfoWithRoles';
import { getUserEmailAddress } from '../../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import UserInfoPhoneNumberList from '../../../../components/UserInfoPhoneNumberList';
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
			bio,
			utcOffset,
			lastLogin,
			customFields,
			phones,
			nickname,
			createdAt,
			canViewAllInfo,
			sipExtension,
			federated,
		} = data.user;

		return {
			_id,
			name,
			username,
			lastLogin,
			bio,
			canViewAllInfo,
			phoneNumbers: phones?.length ? <UserInfoPhoneNumberList phones={phones} /> : undefined,
			customFields,
			verified: getUserEmailVerified(data.user),
			email: getUserEmailAddress(data.user),
			utcOffset,
			createdAt,
			status: <ReactiveUserStatus uid={_id} />,
			customStatus: <ReactiveUserStatusText uid={_id} />,
			nickname,
			sipExtension,
			federated,
		};
	}, [data]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				{onClickBack ? <ContextualbarBack onClick={onClickBack} /> : <ContextualbarIcon name='user' />}
				<ContextualbarTitle>{t('Full_profile')}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>

			{isPending && (
				<ContextualbarContent>
					<FormSkeleton />
				</ContextualbarContent>
			)}

			{isError && !user && (
				<ContextualbarContent>
					<Box paddingBlock={16}>
						<Callout type='danger'>{t('User_not_found')}</Callout>
					</Box>
				</ContextualbarContent>
			)}

			{!isPending && user && rid && (
				<UserInfoWithRoles
					{...user}
					uid={user._id}
					rid={rid}
					userRoleIds={data?.user?.roles}
					invitationDate={invitationDate}
					actions={<UserInfoActions user={user} rid={rid} isInvited={Boolean(invitationDate)} backToList={onClickBack} />}
				/>
			)}

			{!isPending && user && !rid && <UserInfo {...user} roles={[]} invitationDate={invitationDate} actions={null} />}
		</ContextualbarDialog>
	);
};

export default UserInfoWithData;
