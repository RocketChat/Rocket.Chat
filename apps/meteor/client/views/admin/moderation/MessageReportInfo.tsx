import type { IModerationReport } from '@rocket.chat/core-typings';
import { Box, Message } from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ReportReason from './helpers/ReportReason';

const MessageReportInfo = ({ msgId }: { msgId: string }): JSX.Element => {
	const { t } = useTranslation();
	const getReportsByMessage = useEndpoint('GET', `/v1/moderation.reports`);

	const useRealName = useSetting('UI_Use_Real_Name', false);

	const {
		data: reportsByMessage,
		isLoading: isLoadingReportsByMessage,
		isSuccess: isSuccessReportsByMessage,
		isError: isErrorReportsByMessage,
	} = useQuery({
		queryKey: ['moderation', 'msgReports', 'fetchReasons', { msgId }],
		queryFn: async () => {
			const reports = await getReportsByMessage({ msgId });
			return reports;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

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

	const { reports } = reportsByMessage as unknown as { reports: IModerationReport[] };

	return (
		<>
			{isSuccessReportsByMessage && reportsByMessage?.reports && (
				<Box display='flex' flexDirection='column' width='full' height='full' overflowX='hidden' overflowY='auto'>
					{reports.map((report: IModerationReport, index: number) => (
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
