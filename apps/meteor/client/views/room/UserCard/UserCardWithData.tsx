import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, UserCard, UserCardAction, UserCardRole, UserCardSkeleton } from '@rocket.chat/ui-client';
import { useSetting, useRolesDescription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LocalTime from '../../../components/LocalTime';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { ReactiveUserStatusText } from '../../../components/UserStatusText';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import { useUserRolesByScope } from '../../../hooks/useUserRolesByScope';
import { useMemberExists } from '../../hooks/useMemberExists';
import { useUserInfoActions } from '../hooks/useUserInfoActions';
import type { UserInfoAction } from '../hooks/useUserInfoActions/useUserInfoActions';

export type UserCardWithDataProps = {
	username: string;
	rid: IRoom['_id'];
	onOpenUserInfo: () => void;
	onClose: () => void;
};

const UserCardWithData = ({ username, rid, onOpenUserInfo, onClose }: UserCardWithDataProps) => {
	const { t } = useTranslation();
	const showRealNames = useSetting('UI_Use_Real_Name', false);

	// no placeholder: a card handed off to another author shows a skeleton, not the previous user's data
	const { data, isLoading: isUserInfoLoading } = useUserInfoQuery({ username }, { placeholderData: undefined });
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
			bio = defaultValue,
			utcOffset = defaultValue,
			nickname,
			avatarETag,
			freeSwitchExtension,
			federated,
		} = data?.user || {};

		return {
			_id,
			name: getUserDisplayName(name, username, showRealNames),
			username,
			title,
			roles: roomRoles.length > 0 && roomRoles.map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
			workspaceRoles: workspaceRoles.length > 0 && workspaceRoles.join(', '),
			etag: avatarETag,
			localTime: typeof utcOffset === 'number' && Number.isFinite(utcOffset) && <LocalTime utcOffset={utcOffset} />,
			status: _id && <ReactiveUserStatus uid={_id} />,
			customStatus: _id && <ReactiveUserStatusText uid={_id} />,
			nickname,
			freeSwitchExtension,
		};
	}, [data, username, showRealNames, isLoading, workspaceRoles, roomRoles]);

	const handleOpenUserInfo = useStableCallback(() => {
		onOpenUserInfo();
		onClose();
	});

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: {
			_id: user._id ?? '',
			username: user.username,
			name: user.name,
			freeSwitchExtension: user.freeSwitchExtension,
			federated: user.federated,
		},
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
				button={<IconButton icon='kebab' secondary small />}
				title={t('More')}
				key='menu'
				sections={menuOptions}
				placement='bottom-start'
				callbackAction={onClose}
			/>
		);
	}, [menuOptions, onClose, t]);

	const actions = useMemo(() => {
		const mapAction = ([key, { content, title, icon, onClick, disabled }]: [string, UserInfoAction]) => (
			<UserCardAction key={key} label={content || title} icon={icon} onClick={onClick} disabled={disabled} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	if (isLoading) {
		return <UserCardSkeleton />;
	}

	return <UserCard user={user} onOpenUserInfo={handleOpenUserInfo} actions={actions} />;
};

export default UserCardWithData;
