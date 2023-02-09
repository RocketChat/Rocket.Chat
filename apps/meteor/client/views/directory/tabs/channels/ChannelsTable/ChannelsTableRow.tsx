import type { IRoom, ITeam } from '@rocket.chat/core-typings';
import { Box, TableRow, TableCell, Avatar } from '@rocket.chat/fuselage';
import React from 'react';

import MarkdownText from '../../../../../components/MarkdownText';
import { RoomIcon } from '../../../../../components/RoomIcon';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import RoomTags from '../../../RoomTags';

type ChannelsTableRowProps = {
	onClick: (name: IRoom['name'], type: IRoom['t']) => (e: React.KeyboardEvent | React.MouseEvent) => void;
	room: IRoom & { belongsTo?: ITeam };
	mediaQuery: boolean;
};

const ChannelsTableRow = ({ onClick, room, mediaQuery }: ChannelsTableRowProps) => {
	const formatDate = useFormatDate();
	const { _id, ts, t, name, fname, usersCount, lastMessage, topic, belongsTo } = room;
	const avatarUrl = roomCoordinator.getRoomDirectives(t)?.getAvatarPath(room);

	return (
		<TableRow key={_id} onKeyDown={onClick(name, t)} onClick={onClick(name, t)} tabIndex={0} role='link' action>
			<TableCell>
				<Box display='flex'>
					<Box flexGrow={0}>{avatarUrl && <Avatar size='x40' title={fname || name} url={avatarUrl} />}</Box>
					<Box flexGrow={1} mi='x8' withTruncatedText>
						<Box display='flex' alignItems='center'>
							<RoomIcon room={room} />
							<Box fontScale='p2m' mi='x4'>
								{fname || name}
							</Box>
							<RoomTags room={room} />
						</Box>
						{topic && <MarkdownText variant='inlineWithoutBreaks' fontScale='p2' color='hint' withTruncatedText content={topic} />}
					</Box>
				</Box>
			</TableCell>
			<TableCell fontScale='p2' color='hint' withTruncatedText>
				{usersCount}
			</TableCell>
			{mediaQuery && ts && (
				<TableCell fontScale='p2' color='hint' withTruncatedText>
					{formatDate(ts)}
				</TableCell>
			)}
			{mediaQuery && (
				<TableCell fontScale='p2' color='hint' withTruncatedText>
					{lastMessage && formatDate(lastMessage.ts)}
				</TableCell>
			)}
			{mediaQuery && (
				<TableCell fontScale='p2' color='hint' withTruncatedText>
					{belongsTo}
				</TableCell>
			)}
		</TableRow>
	);
};

export default ChannelsTableRow;
