import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetting, useRolesDescription } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LocalTime from '../../../components/LocalTime';
import { UserCard, UserCardAction, UserCardRole, UserCardSkeleton } from '../../../components/UserCard';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import { useMemberExists } from '../../hooks/useMemberExists';
import { useUserInfoActions } from '../hooks/useUserInfoActions';
import type { UserInfoAction } from '../hooks/useUserInfoActions/useUserInfoActions';

type UserCardWithDataProps = {
	username: string;
	rid: IRoom['_id'];
	onOpenUserInfo: () => void;
	onClose: () => void;
};

const UserCardWithData = ({ username, rid, onOpenUserInfo, onClose }: UserCardWithDataProps) => {
	const { t } = useTranslation();
	const getRoles = useRolesDescription();
	const showRealNames = useSetting('UI_Use_Real_Name', false);

	const { data, isLoading: isUserInfoLoading } = useUserInfoQuery({ username });
	const {
		data: isMemberData,
		refetch,
		isSuccess: membershipCheckSuccess,
		isLoading: isMembershipStatusLoading,
	} = useMemberExists({ roomId: rid, username });

	const isLoading = isUserInfoLoading || isMembershipStatusLoading;
	const isMember = membershipCheckSuccess && isMemberData?.isMember;

	const user = useMemo(() => {
		const defaultValue = isLoading ? undefined : null;

		const {
			_id,
			name,
			roles = defaultValue,
			statusText = defaultValue,
			bio = defaultValue,
			utcOffset = defaultValue,
			nickname,
			avatarETag,
			freeSwitchExtension,
		} = data?.user || {};

		return {
			_id,
			name: getUserDisplayName(name, username, showRealNames),
			username,
			roles: roles && getRoles(roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
			bio,
			etag: avatarETag,
			localTime: utcOffset && Number.isInteger(utcOffset) && <LocalTime utcOffset={utcOffset} />,
			status: _id && <ReactiveUserStatus uid={_id} />,
			customStatus: statusText,
			nickname,
			freeSwitchExtension,
		};
	}, [data, username, showRealNames, isLoading, getRoles]);

	const handleOpenUserInfo = useEffectEvent(() => {
		onOpenUserInfo();
		onClose();
	});

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: { _id: user._id ?? '', username: user.username, name: user.name, freeSwitchExtension: user.freeSwitchExtension },
		size: 3,
		isMember,
		reload: refetch,
	});

	const menu = useMemo(() => {
		if (!menuOptions?.length) {
			return null;
		}

		return (
			<GenericMenu
				title={t('More')}
				key='menu'
				data-qa-id='menu'
				sections={menuOptions}
				placement='bottom-start'
				callbackAction={onClose}
			/>
		);
	}, [menuOptions, onClose, t]);

	const actions = useMemo(() => {
		const mapAction = ([key, { content, title, icon, onClick }]: [string, UserInfoAction]): ReactElement => (
			<UserCardAction key={key} label={content || title} aria-label={content || title} onClick={onClick} icon={icon!} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	if (isLoading) {
		return <UserCardSkeleton />;
	}

	return <UserCard user={user} onClose={onClose} onOpenUserInfo={handleOpenUserInfo} actions={actions} />;
};

export default UserCardWithData;
