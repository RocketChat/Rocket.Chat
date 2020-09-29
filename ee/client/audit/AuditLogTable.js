import React, { useMemo } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';

import UserAvatar from '../../../client/components/basic/avatar/UserAvatar';
import { GenericTable } from '../../../client/components/GenericTable';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../client/hooks/useFormatDate';


const FilterDisplay = ({ users, room, startDate, endDate, t }) => <Box display='flex' flexDirection='column' alignItems='stretch' withTruncatedText>
	<Box withTruncatedText>
		{users ? `@${ users[0] } : @${ users[1] }` : `#${ room }`}
	</Box>
	<Box withTruncatedText>
		{startDate} {t('to')} {endDate}
	</Box>
</Box>;

const UserRow = React.memo(({ u, results, ts, _id, formatDateAndTime, formatDate, fields, mediaQuery }) => {
	const t = useTranslation();

	const {
		username,
		name,
		avatarETag,
	} = u;

	const {
		msg,
		users,
		room,
		startDate,
		endDate,
	} = fields;

	const when = useMemo(() => formatDateAndTime(ts), [formatDateAndTime, ts]);

	return <Table.Row key={_id} tabIndex={0} role='link'>
		<Table.Cell withTruncatedText>
			<Box display='flex' alignItems='center'>
				<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag}/>
				<Box display='flex' withTruncatedText mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
						<Box fontScale='p2' withTruncatedText color='default'>{name || username}</Box>
						{name && <Box fontScale='p1' color='hint' withTruncatedText> {`@${ username }`} </Box>}
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell>
			<Box fontScale='p2' withTruncatedText color='hint'>{ msg }</Box> <Box mi='x4'/>
		</Table.Cell>
		<Table.Cell withTruncatedText>{when}</Table.Cell>
		<Table.Cell withTruncatedText>{results}</Table.Cell>
		<Table.Cell fontScale='p1' color='hint' withTruncatedText>
			<FilterDisplay t={t} users={users} room={room} startDate={formatDate(startDate)} endDate={formatDate(endDate)}/>
		</Table.Cell>
	</Table.Row>;
});

export function AuditLogTable({ data }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const formatDate = useFormatDate();

	return <GenericTable
		header={<>
			<GenericTable.HeaderCell >
				{t('Username')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell >
				{t('Looked_for')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('When')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell w='x80'>
				{t('Results')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell >
				{t('Filters_applied')}
			</GenericTable.HeaderCell>
		</>}
		results={data}
	>
		{(props) => <UserRow key={props._id} formatDateAndTime={formatDateAndTime} formatDate={formatDate} {...props}/>}
	</GenericTable>;
}

export default AuditLogTable;
