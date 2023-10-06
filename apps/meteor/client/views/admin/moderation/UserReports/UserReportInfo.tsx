import {
	Box,
	Callout,
	Message,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesTitle,
	ContextualbarFooter,
	FieldGroup,
	Field,
	FieldLabel,
	FieldRow,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import GenericNoResults from '../../../../components/GenericNoResults';
import UserCard from '../../../../components/UserCard';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import ReportReason from '../helpers/ReportReason';
import UserProfile from '../helpers/UserProfile';
import UserContextFooter from './UserContextFooter';

// TODO: Missing Error State
const UserReportInfo = ({ userId }: { userId: string }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const getUserReports = useEndpoint('GET', '/v1/moderation.user.reportsByUserId');
	const formatDateAndTime = useFormatDate();

	const {
		data: report,
		refetch: reloadUsersReports,
		isLoading: isLoadingUsersReports,
		isSuccess: isSuccessUsersReports,
		isError,
		dataUpdatedAt,
	} = useQuery(
		['moderation.usersReport', { userId }],
		async () => {
			const reports = await getUserReports({ userId });
			return reports;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const handleChange = useMutableCallback(() => {
		reloadUsersReports();
	});

	const userEmails = useMemo(() => {
		if (!report?.user?.emails) {
			return [];
		}
		return report.user.emails.map((email) => email.address);
	}, [report]);

	if (isError) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' pb={20} color='default'>
				<StatesIcon name='warning' variation='danger' />
				<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				<StatesActions>
					<StatesAction onClick={handleChange}>{t('Reload_page')}</StatesAction>
				</StatesActions>
			</Box>
		);
	}

	return (
		<>
			<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
				{isLoadingUsersReports && <Message>{t('Loading')}</Message>}

				{isSuccessUsersReports && report.user ? (
					<Box paddingInlineStart={16} marginBlock='x24'>
						<FieldGroup>
							<Field>
								<UserProfile key={dataUpdatedAt} username={report.user.username} name={report.user.name} />
							</Field>
							<Field>
								<FieldLabel>{t('Roles')}</FieldLabel>
								<FieldRow justifyContent='flex-start' spacing={1}>
									{report.user.roles.map((role, index) => (
										<UserCard.Role key={index}>{role}</UserCard.Role>
									))}
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Email')}</FieldLabel>
								<FieldRow>{userEmails.join(', ')}</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Created_at')}</FieldLabel>
								<FieldRow>{formatDateAndTime(report.user.createdAt)}</FieldRow>
							</Field>
						</FieldGroup>
					</Box>
				) : (
					<Box padding={16}>
						<Callout mbs={8} type='warning' icon='warning'>
							{t('Moderation_User_deleted_warning')}
						</Callout>
					</Box>
				)}
				{isSuccessUsersReports && report.reports.length === 0 && <GenericNoResults />}
				{isSuccessUsersReports &&
					report.reports.length > 0 &&
					report.reports.map((report, ind) => (
						<Box key={report._id} paddingInlineStart={16}>
							<ReportReason ind={ind + 1} uinfo={report.reportedBy?.username} msg={report.description} ts={new Date(report.ts)} />
						</Box>
					))}
			</Box>
			<ContextualbarFooter display='flex'>
				{isSuccessUsersReports && report.reports.length > 0 && <UserContextFooter userId={userId} deleted={!report.user} />}
			</ContextualbarFooter>
		</>
	);
};

export default UserReportInfo;
