import { Box, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemIcon, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { STATUS_LABEL_KEYS } from '../../../../components/UserStatusText';
import type { BannedUser } from '../../../hooks/useRoomBannedUsers';

export type BannedUsersItemProps = {
	user: BannedUser;
	useRealName: boolean;
	onClickUnban: (username: string) => void;
};

const BannedUsersItem = ({ user, useRealName, onClickUnban }: BannedUsersItemProps) => {
	const { t } = useTranslation();

	const [nameOrUsername, displayUsername] = getUserDisplayNames(user.name, user.username, useRealName);
	const federated = user.username.startsWith('@') && user.username.includes(':');
	const status = useUserPresence(user._id)?.status;
	const iconLabel = federated ? t('Federated') : status && t(STATUS_LABEL_KEYS[status]);

	const options = useMemo(
		() => [
			{
				id: 'unban-user',
				content: <Box color='status-font-on-danger'>{t('Unban_user_from_room')}</Box>,
				icon: 'ban' as const,
				iconColor: 'status-font-on-danger',
				onClick: () => onClickUnban(user.username),
			},
		],
		[onClickUnban, t, user.username],
	);

	return (
		<Item role='listitem' size='medium' inset='lg'>
			<ItemMedia>
				<UserAvatar username={normalizeUsername(user.username)} size='x28' />
			</ItemMedia>
			<ItemIcon label={iconLabel}>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={user._id} />}</ItemIcon>
			<ItemContent>
				<ItemTitle>
					{nameOrUsername} {displayUsername && <ItemDescription inline>@{displayUsername}</ItemDescription>}
				</ItemTitle>
			</ItemContent>
			<ItemActions reveal='hover'>
				<GenericMenu detached title={t('More')} items={options} placement='bottom-end' />
			</ItemActions>
		</Item>
	);
};

export default BannedUsersItem;
