import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow, useFormatDateAndTime } from '@rocket.chat/ui-client';

import ModerationConsoleActions from './ModerationConsoleActions';
import UserColumn from './helpers/UserColumn';
import { normalizeUsername } from '../../../../lib/utils/normalizeUsername';

export type ModerationConsoleRowProps = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
	isDesktopOrLarger: boolean;
};

const ModerationConsoleTableRow = ({ report, onClick, isDesktopOrLarger }: ModerationConsoleRowProps) => {
	const { userId: _id, rooms, name, count, ts } = report;
	const username = report.username ? normalizeUsername(report.username) : undefined;

	const roomNames = rooms.map((room) => {
		if (room.t === 'd') {
			return room.name || 'Private';
		}
		return room.fname || room.name;
	});

	const formatDateAndTime = useFormatDateAndTime();

	const concatenatedRoomNames = roomNames.join(', ');

	return (
		<GenericTableRow key={_id} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<GenericTableCell truncate>
				<UserColumn username={username} name={name} fontSize='micro' size={isDesktopOrLarger ? 'x20' : 'x40'} />
			</GenericTableCell>
			<GenericTableCell truncate>{concatenatedRoomNames}</GenericTableCell>
			<GenericTableCell truncate>{formatDateAndTime(ts)}</GenericTableCell>
			<GenericTableCell truncate>{count}</GenericTableCell>
			<GenericTableCell onClick={(e): void => e.stopPropagation()}>
				<ModerationConsoleActions report={report} onClick={onClick} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ModerationConsoleTableRow;
