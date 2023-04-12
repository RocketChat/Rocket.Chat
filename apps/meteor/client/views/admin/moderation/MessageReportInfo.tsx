import { Box, Message } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../hooks/useFormatTime';

const MessageReportInfo = ({ msgId }: { msgId: string }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const getReportsByMessage = useEndpoint('GET', `/v1/moderation.reportsByMessage`);

	const formatDateAndTime = useFormatDateAndTime();
	const formatTime = useFormatTime();
	const formatDate = useFormatDate();

	const {
		data: reportsByMessage,
		isLoading: isLoadingReportsByMessage,
		isSuccess: isSuccessReportsByMessage,
		isError: isErrorReportsByMessage,
	} = useQuery(
		['reportsByMessage', { msgId }],
		async () => {
			const reports = await getReportsByMessage({ msgId });
			return reports;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	if (isLoadingReportsByMessage) {
		return (
			<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
				<Message>{t('Loading')}</Message>
			</Box>
		);
	}

	if (isErrorReportsByMessage) {
		return (
			<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
				<Message>{t('Error')}</Message>
			</Box>
		);
	}

	const { reports } = reportsByMessage;

	return (
		<>
			{isSuccessReportsByMessage && reportsByMessage?.reports && (
				<Box display='flex' flexDirection='column' width='full' height='full' overflowX='hidden' overflowY='auto'>
					{reports.map((report) => (
						<Box key={report._id}>
							<Message.Divider>{formatDate(report.ts)}</Message.Divider>
							<Message>
								{}
								<Message.LeftContainer>
									<UserAvatar username={report?.reportedBy?.username || 'rocket.cat'} />
								</Message.LeftContainer>
								<Message.Container>
									<Message.Header>
										<Message.Name>{report.reportedBy ? report.reportedBy.name : 'Rocket.Cat'}</Message.Name>
										<Message.Username>@{report.reportedBy ? report.reportedBy.username : 'rocket.cat'}</Message.Username>
										<Message.Timestamp title={formatDateAndTime(report.ts)}>{formatTime(report.ts)}</Message.Timestamp>
									</Message.Header>
									<Message.Body>{report.description}</Message.Body>
								</Message.Container>
							</Message>
						</Box>
					))}
				</Box>
			)}
		</>
	);
};

export default MessageReportInfo;
