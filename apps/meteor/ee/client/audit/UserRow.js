import { Box, Table } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import UserAvatar from '../../../client/components/avatar/UserAvatar';
import FilterDisplay from './FilterDisplay';

const UserRow = ({ u, results, ts, _id, formatDateAndTime, formatDate, fields, mediaQuery }) => {
	const t = useTranslation();

	const { username, name, avatarETag } = u;

	const { msg, users, room, startDate, endDate } = fields;

	const when = useMemo(() => formatDateAndTime(ts), [formatDateAndTime, ts]);

	return (
		<Table.Row key={_id} tabIndex={0} role='link'>
			<Table.Cell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />
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
			</Table.Cell>
			<Table.Cell>
				<Box fontScale='p2m' withTruncatedText color='hint'>
					{msg}
				</Box>{' '}
				<Box mi='x4' />
			</Table.Cell>
			<Table.Cell withTruncatedText>{when}</Table.Cell>
			<Table.Cell withTruncatedText>{results}</Table.Cell>
			<Table.Cell fontScale='p2' color='hint' withTruncatedText>
				<FilterDisplay t={t} users={users} room={room} startDate={formatDate(startDate)} endDate={formatDate(endDate)} />
			</Table.Cell>
		</Table.Row>
	);
};

export default memo(UserRow);
