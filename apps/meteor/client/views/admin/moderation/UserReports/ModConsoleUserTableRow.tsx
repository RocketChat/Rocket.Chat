import type { IUser, UserReport, Serialized } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow, useFormatDateAndTime } from '@rocket.chat/ui-client';

import ModConsoleUserActions from './ModConsoleUserActions';
import { normalizeUsername } from '../../../../../lib/utils/normalizeUsername';
import UserColumn from '../helpers/UserColumn';

export type ModConsoleUserRowProps = {
	report: Serialized<Pick<UserReport, '_id' | 'reportedUser' | 'ts'> & { count: number }>;
	onClick: (id: IUser['_id']) => void;
	isDesktopOrLarger: boolean;
};

const ModConsoleUserTableRow = ({ report, onClick, isDesktopOrLarger }: ModConsoleUserRowProps) => {
	const { reportedUser, count, ts } = report;
	const { _id, name, createdAt, emails } = reportedUser;
	const username = reportedUser.username ? normalizeUsername(reportedUser.username) : undefined;

	const formatDateAndTime = useFormatDateAndTime();

	return (
		<GenericTableRow key={_id} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<GenericTableCell truncate>
				<UserColumn name={name} username={username} fontSize='micro' size={isDesktopOrLarger ? 'x20' : 'x40'} />
			</GenericTableCell>
			<GenericTableCell truncate>{formatDateAndTime(createdAt)}</GenericTableCell>
			<GenericTableCell truncate>{emails?.[0].address}</GenericTableCell>
			<GenericTableCell truncate>{formatDateAndTime(ts)}</GenericTableCell>
			<GenericTableCell truncate>{count}</GenericTableCell>
			<GenericTableCell onClick={(e): void => e.stopPropagation()}>
				<ModConsoleUserActions report={report} onClick={onClick} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ModConsoleUserTableRow;
