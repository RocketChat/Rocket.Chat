import type { IReport } from '@rocket.chat/core-typings';
import { TableRow, TableCell, Box, Menu } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useEffect, useMemo } from 'react';

import { formatDateAndTime } from '../../../../client/lib/utils/formatDateAndTime';
import UserAvatar from '../../../components/avatar/UserAvatar';
import type { GroupedReports } from './ModerationConsoleTable';

type MonderationConsoleRowProps = {
	report: GroupedReports;
	onClick: (id: IReport['_id']) => void;
	reload: MutableRefObject<() => void>;
};

const ModerationConsoleTableRow = ({ report, onClick, reload }: MonderationConsoleRowProps): JSX.Element => {
	const { messageId, reports } = report;
	const { _id, message, ts } = reports[0];
	const { username } = message.u;

	// write a custom query to get the reports data from the database

	const query = useDebouncedValue(
		useMemo(
			() => ({
				count: 50,
				msgId: message._id,
			}),
			[message._id],
		),
		500,
	);

	const dispatchToastMessage = useToastMessageDispatch();

	const getReportsByMessage = useEndpoint('GET', '/v1/moderation.reportsByMessage');

	const {
		data: reportsByMessage,
		refetch: reloadReportsByMessage,
		isLoading: isLoadingReportsByMessage,
		isSuccess: isSuccessReportsByMessage,
	} = useQuery(
		['reportsByMessage', query],
		async () => {
			const reports = await getReportsByMessage(query);
			return reports;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = reloadReportsByMessage;
	}, [reload, reloadReportsByMessage]);

	// a return function based on the status of the query which shows the query total or a loading spinner or a "-" incase of error

	const renderReportsByMessage = (): string | number => {
		if (isLoadingReportsByMessage) {
			return '...';
		}

		if (isSuccessReportsByMessage) {
			return reportsByMessage.total;
		}

		return '-';
	};

	return (
		<TableRow key={_id} onKeyDown={(): void => onClick(messageId)} onClick={(): void => onClick(messageId)} tabIndex={0} role='link' action>
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
			<TableCell withTruncatedText>{message.msg}</TableCell>
			<TableCell withTruncatedText>{message.rid}</TableCell>
			<TableCell withTruncatedText>{formatDateAndTime(ts)}</TableCell>
			<TableCell withTruncatedText>{renderReportsByMessage()}</TableCell>
			<TableCell onClick={(e): void => e.stopPropagation()}>
				<Menu
					options={{
						seeReports: {
							label: 'See Reports',
							action: () => console.log('See Reports'),
						},
					}}
				/>
			</TableCell>
		</TableRow>
	);
};

export default ModerationConsoleTableRow;
