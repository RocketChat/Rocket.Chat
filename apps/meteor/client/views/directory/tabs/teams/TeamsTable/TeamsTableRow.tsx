import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, Avatar } from '@rocket.chat/fuselage';
import type { KeyboardEvent, MouseEvent } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';
import MarkdownText from '../../../../../components/MarkdownText';
import { RoomIcon } from '../../../../../components/RoomIcon';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import RoomTags from '../../../RoomTags';

type TeamsTableRowProps = {
	onClick: (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => void;
	team: Serialized<IRoom & { roomsCount: number }>;
	mediaQuery: boolean;
};

const TeamsTableRow = ({ onClick, team, mediaQuery }: TeamsTableRowProps) => {
	const formatDate = useFormatDate();
	const { _id, ts, t, name, fname, topic, roomsCount } = team;
	const avatarUrl = roomCoordinator.getRoomDirectives(t).getAvatarPath(team);

	return (
		<GenericTableRow key={_id} onKeyDown={onClick(name, t)} onClick={onClick(name, t)} tabIndex={0} role='link' action>
			<GenericTableCell>
				<Box display='flex'>
					<Box flexGrow={0}>{avatarUrl && <Avatar size='x40' title={fname || name} url={avatarUrl} />}</Box>
					<Box flexGrow={1} mi={8} withTruncatedText>
						<Box display='flex' alignItems='center'>
							<RoomIcon room={team} />
							<Box fontScale='p2m' mi={4}>
								{fname || name}
							</Box>
							<RoomTags room={team} />
						</Box>
						{topic && <MarkdownText variant='inlineWithoutBreaks' fontScale='p2' color='hint' withTruncatedText content={topic} />}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{roomsCount}
			</GenericTableCell>
			{mediaQuery && ts && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{formatDate(ts)}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default TeamsTableRow;
