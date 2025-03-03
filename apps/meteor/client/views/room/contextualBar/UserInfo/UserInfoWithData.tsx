import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useRolesDescription } from '@rocket.chat/ui-contexts';
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
} from '../../../../components/Contextualbar';
import { FormSkeleton } from '../../../../components/Skeleton';
import { UserCardRole } from '../../../../components/UserCard';
import { UserInfo } from '../../../../components/UserInfo';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
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

	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData('/v1/users.info', {
		params: useMemo(() => {
			if (uid) {
				return { userId: uid };
			}

			if (username) {
				return { username };
			}

			throw new Error('userId or username is required');
		}, [uid, username]),
	});

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
			freeSwitchExtension,
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
			freeSwitchExtension,
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

			{!isLoading && user && <UserInfo {...user} actions={<UserInfoActions user={user} rid={rid} backToList={onClickBack} />} />}
		</>
	);
};

export default UserInfoWithData;
