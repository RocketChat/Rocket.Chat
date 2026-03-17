import { Box, Option, OptionAvatar, OptionContent, OptionDescription, OptionMenu } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import type { BannedUser } from '../../../hooks/useRoomBannedUsers';

type BannedUsersItemProps = {
	user: BannedUser;
	useRealName: boolean;
	onClickUnban: (username: string) => void;
};

const BannedUsersItem = ({ user, useRealName, onClickUnban }: BannedUsersItemProps): ReactElement => {
	const { t } = useTranslation();

	const [nameOrUsername, displayUsername] = getUserDisplayNames(user.name, user.username, useRealName);

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
		<Option style={{ paddingInline: 24 }}>
			<OptionAvatar>
				<UserAvatar size='x40' username={normalizeUsername(user.username)} />
			</OptionAvatar>
			<OptionContent>
				<strong>{nameOrUsername}</strong>
				{displayUsername && <OptionDescription>@{displayUsername}</OptionDescription>}
			</OptionContent>
			<OptionMenu>
				<GenericMenu detached title={t('More')} items={options} placement='bottom-end' />
			</OptionMenu>
		</Option>
	);
};

export default BannedUsersItem;
