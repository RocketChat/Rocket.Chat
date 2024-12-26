import type { IUser, UserReport, Serialized } from '@rocket.chat/core-typings';

import ModConsoleUserActions from './ModConsoleUserActions';
import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import UserColumn from '../helpers/UserColumn';

export type ModConsoleUserRowProps = {
	report: Serialized<Pick<UserReport, '_id' | 'reportedUser' | 'ts'> & { count: number }>;
	onClick: (id: IUser['_id']) => void;
	isDesktopOrLarger: boolean;
};

const ModConsoleUserTableRow = ({ report, onClick, isDesktopOrLarger }: ModConsoleUserRowProps): JSX.Element => {
	const { reportedUser, count, ts } = report;
	const { _id, username, name, createdAt, emails } = reportedUser;

	const formatDateAndTime = useFormatDateAndTime();

	return (
		<GenericTableRow key={_id} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<GenericTableCell withTruncatedText>
				<UserColumn name={name} username={username} fontSize='micro' size={isDesktopOrLarger ? 'x20' : 'x40'} />
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{formatDateAndTime(createdAt)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{emails?.[0].address}</GenericTableCell>
			<GenericTableCell withTruncatedText>{formatDateAndTime(ts)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{count}</GenericTableCell>
			<GenericTableCell onClick={(e): void => e.stopPropagation()}>
				<ModConsoleUserActions report={report} onClick={onClick} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ModConsoleUserTableRow;
