import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, Avatar } from '@rocket.chat/fuselage';
import type { KeyboardEvent, MouseEvent } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';
import MarkdownText from '../../../../../components/MarkdownText';
import { RoomIcon } from '../../../../../components/RoomIcon';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import RoomTags from '../../../RoomTags';

type ChannelsTableRowProps = {
	onClick: (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => void;
	room: Serialized<IRoom & { belongsTo?: string }>;
	mediaQuery: boolean;
};

const ChannelsTableRow = ({ onClick, room, mediaQuery }: ChannelsTableRowProps) => {
	const formatDate = useFormatDate();
	const { _id, ts, t, name, fname, usersCount, lastMessage, topic, belongsTo } = room;
	const avatarUrl = roomCoordinator.getRoomDirectives(t).getAvatarPath(room);

	return (
		<GenericTableRow key={_id} onKeyDown={onClick(name, t)} onClick={onClick(name, t)} tabIndex={0} role='link' action>
			<GenericTableCell>
				<Box display='flex'>
					<Box flexGrow={0}>{avatarUrl && <Avatar size='x40' title={fname || name} url={avatarUrl} />}</Box>
					<Box flexGrow={1} mi={8} withTruncatedText>
						<Box display='flex' alignItems='center'>
							<RoomIcon room={room} />
							<Box fontScale='p2m' mi={4}>
								{fname || name}
							</Box>
							<RoomTags room={room} />
						</Box>
						{topic && <MarkdownText variant='inlineWithoutBreaks' fontScale='p2' color='hint' withTruncatedText content={topic} />}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{usersCount}
			</GenericTableCell>
			{mediaQuery && ts && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{formatDate(ts)}
				</GenericTableCell>
			)}
			{mediaQuery && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{lastMessage && formatDate(lastMessage.ts)}
				</GenericTableCell>
			)}
			{mediaQuery && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{belongsTo}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default ChannelsTableRow;
