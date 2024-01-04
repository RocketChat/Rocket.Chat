import type { IUserInRole } from '@rocket.chat/core-typings';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { getUserEmailAddress } from '../../../../../../lib/getUserEmailAddress';
import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';
import UserAvatar from '../../../../../components/avatar/UserAvatar';

type UsersInRoleTableRowProps = {
	user: IUserInRole;
	onRemove: (username: IUserInRole['username']) => void;
};

const UsersInRoleTableRow = ({ user, onRemove }: UsersInRoleTableRowProps): ReactElement => {
	const { _id, name, username, avatarETag } = user;
	const email = getUserEmailAddress(user);

	const handleRemove = useMutableCallback(() => {
		onRemove(username);
	});

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link'>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x40' username={username ?? ''} etag={avatarETag} />
					<Box display='flex' withTruncatedText mi={8}>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' withTruncatedText color='default'>
								{name || username}
							</Box>
							{name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{email}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{/* FIXME: Replace to IconButton */}
				<Button small square secondary danger onClick={handleRemove}>
					<Icon name='trash' size='x20' />
				</Button>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default memo(UsersInRoleTableRow);
