import { Box, Message, Tabs } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useState, useEffect } from 'react';

import UserAvatar from '../../../../client/components/avatar/UserAvatar';
// import { useUserData } from '../../../../client/hooks/useUserData';
import { formatDate } from '../../../../client/lib/utils/formatDate';
// import { formatDateAndTime } from '../../../../client/lib/utils/formatDateAndTime';
import { formatTime } from '../../../../client/lib/utils/formatTime';

const MessageReportInfo = ({ msgId, reload }: { msgId: string; reload: MutableRefObject<() => void> }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [tab, setTab] = useState('info');
	const getReportsByMessage = useEndpoint('GET', `/v1/moderation.reportsByMessage`);

	const {
		data: reportsByMessage,
		refetch: reloadReportsByMessage,
		isLoading: isLoadingReportsByMessage,
		isSuccess: isSuccessReportsByMessage,
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

	useEffect(() => {
		reload.current = reloadReportsByMessage;
	}, [reload, reloadReportsByMessage]);

	if (isLoadingReportsByMessage) {
		return (
			<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
				<Message>{t('Loading')}</Message>
			</Box>
		);
	}

	if (!isSuccessReportsByMessage) {
		return (
			<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
				<Message>{t('Error')}</Message>
			</Box>
		);
	}

	const { reports } = reportsByMessage;

	const { message } = reports[0];

	console.log('data', reportsByMessage);

	return (
		<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
			<Tabs>
				<Tabs.Item selected={tab === 'info'} onClick={() => setTab('info')}>
					{t('Message')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'reports'} onClick={() => setTab('reports')}>
					{t('Reports')}
				</Tabs.Item>
			</Tabs>
			{tab === 'info' && reportsByMessage?.reports && (
				<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
					<Message.Divider>{formatDate(message._updatedAt)}</Message.Divider>
					<Message>
						<Message.LeftContainer>
							<UserAvatar username={message.u.username} />
						</Message.LeftContainer>
						<Message.Container>
							<Message.Header>
								<Message.Name>{message.u.name}</Message.Name>
								<Message.Username>@{message.u.username}</Message.Username>
								<Message.Timestamp>{formatTime(message._updatedAt)}</Message.Timestamp>
							</Message.Header>
							<Message.Body>{message.msg}</Message.Body>
						</Message.Container>
					</Message>
				</Box>
			)}
			{tab === 'reports' && reportsByMessage?.reports && (
				<Box display='flex' flexDirection='column' width='full' height='full' overflow='hidden'>
					{reports.map((report) => (
						<Box display='flex' flexDirection='column' width='full' overflow='hidden' key={report._id}>
							<Message.Divider>{formatDate(report._updatedAt)}</Message.Divider>
							<Message>
								<Message.LeftContainer></Message.LeftContainer>
								<Message.Container>
									<Message.Header>
										<Message.Timestamp>{formatTime(report._updatedAt)}</Message.Timestamp>
									</Message.Header>
									<Message.Body>{report.description}</Message.Body>
								</Message.Container>
							</Message>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};

export default MessageReportInfo;
