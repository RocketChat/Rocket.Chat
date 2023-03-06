import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';
import { TableRow, TableCell, Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { formatDateAndTime } from '../../../lib/utils/formatDateAndTime';
import ModerationConsoleActions from './ModerationConsoleActions';

export type MonderationConsoleRowProps = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
};

const ModerationConsoleTableRow = ({ report, onClick }: MonderationConsoleRowProps): JSX.Element => {
	const { userId: _id, rooms, count, message, username, ts } = report;

	const roomNames = rooms.map((room) => {
		if (room.t === 'd') {
			return room.name || 'Private';
		}
		return room.fname || room.name;
	});

	const concatenatedRoomNames = roomNames.join(', ');

	// write a custom query to get the reports data from the database

	// const query = useDebouncedValue(
	// 	useMemo(
	// 		() => ({
	// 			count: 50,
	// 			msgId: message._id,
	// 		}),
	// 		[message._id],
	// 	),
	// 	500,
	// );

	// const dispatchToastMessage = useToastMessageDispatch();

	// const countReportsByMsgId = useEndpoint('GET', '/v1/moderation.countReportsByMsgId');

	// const {
	// 	data: reportsByMessage,
	// 	refetch: reloadReportsByMessage,
	// 	isLoading: isLoadingReportsByMessage,
	// 	isSuccess: isSuccessReportsByMessage,
	// } = useQuery(
	// 	['reportsByMessage', query],
	// 	async () => {
	// 		const reports = await countReportsByMsgId(query);
	// 		return reports;
	// 	},
	// 	{
	// 		onError: (error) => {
	// 			dispatchToastMessage({ type: 'error', message: error });
	// 		},
	// 	},
	// );

	// useEffect(() => {
	// 	reload.current = reloadReportsByMessage;
	// }, [reload, reloadReportsByMessage]);

	// // a return function based on the status of the query which shows the query total or a loading spinner or a "-" incase of error

	// const renderReportsByMessage = (): string | number => {
	// 	if (isLoadingReportsByMessage) {
	// 		return '...';
	// 	}

	// 	if (isSuccessReportsByMessage) {
	// 		return reportsByMessage.reportCounts;
	// 	}

	// 	return '-';
	// };

	return (
		<TableRow key={_id} onKeyDown={(): void => onClick(_id)} onClick={(): void => onClick(_id)} tabIndex={0} role='link' action>
			<TableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={'x40'} username={username} />}
					<Box display='flex' mi='x8' withTruncatedText>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' color='default' withTruncatedText>
								{username}
							</Box>
						</Box>
					</Box>
				</Box>
			</TableCell>
			<TableCell withTruncatedText>{message}</TableCell>
			<TableCell withTruncatedText>{concatenatedRoomNames}</TableCell>
			<TableCell withTruncatedText>{formatDateAndTime(ts)}</TableCell>
			<TableCell withTruncatedText>{count}</TableCell>
			<TableCell onClick={(e): void => e.stopPropagation()}>
				<ModerationConsoleActions report={report} onClick={onClick} />
			</TableCell>
		</TableRow>
	);
};

export default ModerationConsoleTableRow;
