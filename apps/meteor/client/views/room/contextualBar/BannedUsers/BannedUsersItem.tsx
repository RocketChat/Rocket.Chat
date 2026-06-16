import { Box, Icon, Option, OptionAvatar, OptionColumn, OptionContent, OptionDescription, OptionMenu } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import type { BannedUser } from '../../../hooks/useRoomBannedUsers';

type BannedUsersItemProps = {
	user: BannedUser;
	useRealName: boolean;
	onClickUnban: (username: string) => void;
};

const BannedUsersItem = ({ user, useRealName, onClickUnban }: BannedUsersItemProps) => {
	const { t } = useTranslation();

	const [nameOrUsername, displayUsername] = getUserDisplayNames(user.name, user.username, useRealName);
	const federated = user.username.startsWith('@') && user.username.includes(':');

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
		<Option style={{ paddingInline: 24, cursor: 'default' }}>
			<OptionAvatar>
				<UserAvatar username={normalizeUsername(user.username)} size='x28' />
			</OptionAvatar>
			<OptionColumn>{federated ? <Icon name='globe' size='x16' /> : <ReactiveUserStatus uid={user._id} />}</OptionColumn>
			<OptionContent>
				{nameOrUsername} {displayUsername && <OptionDescription>@{displayUsername}</OptionDescription>}
			</OptionContent>
			<OptionMenu>
				<GenericMenu detached title={t('More')} items={options} placement='bottom-end' />
			</OptionMenu>
		</Option>
	);
};

export default BannedUsersItem;
