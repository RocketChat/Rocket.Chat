import type { IUserInRole } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserEmailAddress } from '../../../../../../lib/getUserEmailAddress';
import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';

type UsersInRoleTableRowProps = {
	user: IUserInRole;
	onRemove: (username: IUserInRole['username']) => void;
};

const UsersInRoleTableRow = ({ user, onRemove }: UsersInRoleTableRowProps): ReactElement => {
	const { t } = useTranslation();
	const { _id, name, username, avatarETag } = user;
	const email = getUserEmailAddress(user);

	const handleRemove = useEffectEvent(() => {
		onRemove(username);
	});

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link'>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x40' username={username ?? ''} etag={avatarETag} />
					<Box display='flex' withTruncatedText mi={8}>
						<Box fontScale='p2m' withTruncatedText color='default'>
							{name || username}
						</Box>
						{name && (
							<Box mis={4} fontScale='p2' color='hint' withTruncatedText>
								{`@${username}`}
							</Box>
						)}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{email}</GenericTableCell>
			<GenericTableCell>
				<IconButton small icon='trash' title={t('Remove')} danger onClick={handleRemove} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default memo(UsersInRoleTableRow);
