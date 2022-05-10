import { IUserInRole } from '@rocket.chat/core-typings';
import { Box, TableRow, TableCell, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement } from 'react';

import { getUserEmailAddress } from '../../../../../../lib/getUserEmailAddress';
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
		<TableRow key={_id} tabIndex={0} role='link'>
			<TableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x40' username={username ?? ''} etag={avatarETag} />
					<Box display='flex' withTruncatedText mi='x8'>
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
			</TableCell>
			<TableCell withTruncatedText>{email}</TableCell>
			<TableCell withTruncatedText>
				<Button small square danger onClick={handleRemove}>
					<Icon name='trash' size='x20' />
				</Button>
			</TableCell>
		</TableRow>
	);
};

export default memo(UsersInRoleTableRow);
