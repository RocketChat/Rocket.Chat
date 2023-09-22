import { Box, Message } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import ReportReason from './helpers/ReportReason';

const MessageReportInfo = ({ msgId }: { msgId: string }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const getReportsByMessage = useEndpoint('GET', `/v1/moderation.reports`);

	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));

	const {
		data: reportsByMessage,
		isLoading: isLoadingReportsByMessage,
		isSuccess: isSuccessReportsByMessage,
		isError: isErrorReportsByMessage,
	} = useQuery(
		['moderation.reports', { msgId }],
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
					{reports.map((report, index) => (
						<ReportReason
							key={report._id}
							ind={index + 1}
							uinfo={useRealName ? report.reportedBy?.name : report.reportedBy?.username}
							msg={report.description}
							ts={new Date(report.ts)}
						/>
					))}
				</Box>
			)}
		</>
	);
};

export default MessageReportInfo;
