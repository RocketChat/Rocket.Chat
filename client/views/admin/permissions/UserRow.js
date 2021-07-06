import { Box, Table, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import UserAvatar from '../../../components/avatar/UserAvatar';

const UserRow = ({ _id, username, name, avatarETag, emails, onRemove }) => {
	const email = getUserEmailAddress({ emails });

	const handleRemove = useMutableCallback(() => {
		onRemove(username);
	});

	return (
		<Table.Row key={_id} tabIndex={0} role='link'>
			<Table.Cell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x40' title={username} username={username} etag={avatarETag} />
					<Box display='flex' withTruncatedText mi='x8'>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2' withTruncatedText color='default'>
								{name || username}
							</Box>
							{name && (
								<Box fontScale='p1' color='hint' withTruncatedText>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell withTruncatedText>{email}</Table.Cell>
			<Table.Cell withTruncatedText>
				<Button small square danger onClick={handleRemove}>
					<Icon name='trash' size='x20' />
				</Button>
			</Table.Cell>
		</Table.Row>
	);
};

export default memo(UserRow);
