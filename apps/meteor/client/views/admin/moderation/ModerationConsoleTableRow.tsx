import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';
import { TableRow, TableCell, Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ModerationConsoleActions from './ModerationConsoleActions';

export type MonderationConsoleRowProps = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
	onChange: () => void;
	onReload: () => void;
	mediaQuery: boolean;
};

const ModerationConsoleTableRow = ({ report, onClick, onChange, onReload, mediaQuery }: MonderationConsoleRowProps): JSX.Element => {
	const { userId: _id, rooms, name, count, message, username, ts } = report;

	const roomNames = rooms.map((room) => {
		if (room.t === 'd') {
			return room.name || 'Private';
		}
		return room.fname || room.name;
	});

	const formatDateAndTime = useFormatDateAndTime();

	const concatenatedRoomNames = roomNames.join(', ');

	return (
		<TableRow key={_id} onKeyDown={(): void => onClick(_id)} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<TableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={username} />}
					<Box display='flex' mi='x8' withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								{name || username}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</TableCell>
			{mediaQuery && (
				<TableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{username}
					</Box>{' '}
					<Box mi='x4' />
				</TableCell>
			)}
			<TableCell withTruncatedText>{message}</TableCell>
			<TableCell withTruncatedText>{concatenatedRoomNames}</TableCell>
			<TableCell withTruncatedText>{formatDateAndTime(ts)}</TableCell>
			<TableCell withTruncatedText>{count}</TableCell>
			<TableCell onClick={(e): void => e.stopPropagation()}>
				<ModerationConsoleActions report={report} onClick={onClick} onChange={onChange} onReload={onReload} />
			</TableCell>
		</TableRow>
	);
};

export default ModerationConsoleTableRow;
