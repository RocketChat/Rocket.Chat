import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';

import ModerationConsoleActions from './ModerationConsoleActions';
import UserColumn from './helpers/UserColumn';
import { GenericTableCell, GenericTableRow } from '../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

export type ModerationConsoleRowProps = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
	isDesktopOrLarger: boolean;
};

const ModerationConsoleTableRow = ({ report, onClick, isDesktopOrLarger }: ModerationConsoleRowProps): JSX.Element => {
	const { userId: _id, rooms, name, count, username, ts } = report;

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
			<GenericTableCell withTruncatedText>
				<UserColumn username={username} name={name} fontSize='micro' size={isDesktopOrLarger ? 'x20' : 'x40'} />
			</GenericTableCell>
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
