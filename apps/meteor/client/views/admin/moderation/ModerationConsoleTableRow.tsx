import type { IReport } from '@rocket.chat/core-typings';
import { TableRow, TableCell, Box, Menu } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';

type MonderationConsoleRowProps = {
	report: IReport;
	onClick: (id: IReport['_id']) => void;
};

const ModerationConsoleTableRow = ({ report, onClick }: MonderationConsoleRowProps): JSX.Element => {
	const { _id, description, message, ts } = report;
	const { username } = message.u;
	const { rid } = message;
	const { msg } = message;
	const [text, setText] = useState('');

	// write a custom query to get the reports data from the database

	const query = useDebouncedValue(
		useMemo(
			() => ({
				count: 50,
				msgId: message._id,
				selector: text,
			}),
			[message._id, text],
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
		isError: isErrorReportsByMessage,
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
			<TableCell withTruncatedText>{msg}</TableCell>
			<TableCell withTruncatedText>{rid}</TableCell>
			<TableCell withTruncatedText>{ts}</TableCell>
			<TableCell withTruncatedText>{isSuccessReportsByMessage ? reportsByMessage.total : '-'}</TableCell>
			<TableCell>
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
