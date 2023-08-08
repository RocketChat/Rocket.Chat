import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { GenericTableCell, GenericTableRow } from '../../../components/GenericTable';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ModerationConsoleActions from './ModerationConsoleActions';

export type ModerationConsoleRowProps = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
	isDesktopOrLarger: boolean;
};

const ModerationConsoleTableRow = ({ report, onClick, isDesktopOrLarger }: ModerationConsoleRowProps): JSX.Element => {
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
		<GenericTableRow key={_id} onKeyDown={(): void => onClick(_id)} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{username && (
						<Box>
							<UserAvatar size={isDesktopOrLarger ? 'x20' : 'x40'} username={username} />
						</Box>
					)}
					<Box display='flex' mi={8} withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								{name || username}
							</Box>
							{!isDesktopOrLarger && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{' '}
									{`@${username}`}{' '}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			{isDesktopOrLarger && (
				<GenericTableCell>
					<Box fontScale='p2m' color='hint' withTruncatedText>
						{username}
					</Box>
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText>{message}</GenericTableCell>
			<GenericTableCell withTruncatedText>{concatenatedRoomNames}</GenericTableCell>
			<GenericTableCell withTruncatedText>{formatDateAndTime(ts)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{count}</GenericTableCell>
			<GenericTableCell onClick={(e): void => e.stopPropagation()}>
				<ModerationConsoleActions report={report} onClick={onClick} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ModerationConsoleTableRow;
