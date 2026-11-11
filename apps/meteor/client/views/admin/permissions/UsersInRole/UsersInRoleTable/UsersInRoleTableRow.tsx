import type { IUserInRole, Serialized } from '@rocket.chat/core-typings';
import { Box, IconButton, Text } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserEmailAddress } from '../../../../../../lib/getUserEmailAddress';

export type UsersInRoleTableRowProps = {
	user: Serialized<IUserInRole>;
	onRemove: (username: IUserInRole['username']) => void;
};

const UsersInRoleTableRow = ({ user, onRemove }: UsersInRoleTableRowProps) => {
	const { t } = useTranslation();
	const { _id, name, username, avatarETag } = user;
	const email = getUserEmailAddress(user);

	const handleRemove = useStableCallback(() => {
		onRemove(username);
	});

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link'>
			<GenericTableCell truncate>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x40' username={username ?? ''} etag={avatarETag} />
					<Box display='flex' withTruncatedText marginInline={8}>
						<Text fontScale='p2m' truncate color='default'>
							{name || username}
						</Text>
						{name && (
							<Box marginInlineStart={4} fontScale='p2' color='hint' withTruncatedText>
								{`@${username}`}
							</Box>
						)}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell truncate>{email}</GenericTableCell>
			<GenericTableCell>
				<IconButton size='small' icon='trash' title={t('Remove')} variant='danger' onClick={handleRemove} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default memo(UsersInRoleTableRow);
