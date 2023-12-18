import type { IUser, UserReport, Serialized } from '@rocket.chat/core-typings';
import {
	Box,
	Callout,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesTitle,
	ContextualbarFooter,
	FieldGroup,
	Field,
	FieldLabel,
	FieldRow,
	ContextualbarSkeleton,
} from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import { ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import GenericNoResults from '../../../../components/GenericNoResults';
import UserCard from '../../../../components/UserCard';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import ReportReason from '../helpers/ReportReason';
import UserColumn from '../helpers/UserColumn';
import UserContextFooter from './UserContextFooter';

const UserReportInfo = ({ userId }: { userId: string }) => {
	const t = useTranslation();
	const getUserReports = useEndpoint('GET', '/v1/moderation.user.reportsByUserId');
	const formatDateAndTime = useFormatDate();

	const {
		data: report,
		refetch: reloadUsersReports,
		isLoading,
		isSuccess,
		isError,
		dataUpdatedAt,
	} = useQuery(['moderation', 'userReports', 'fetchDetails', userId], async () => getUserReports({ userId }));

	const userProfile = useMemo(() => {
		if (!report?.user) {
			return null;
		}

		const { username, name } = report.user;
		return <UserColumn key={dataUpdatedAt} username={username} name={name} isProfile={true} />;
	}, [report?.user, dataUpdatedAt]);

	const userEmails = useMemo(() => {
		if (!report?.user?.emails) {
			return [];
		}
		return report.user.emails.map((email) => email.address);
	}, [report]);

	const renderUserDetails = (user: Serialized<IUser>) => {
		return (
			<Box>
				<FieldGroup>
					<Field>{userProfile}</Field>
					<Field>
						<FieldLabel>{t('Roles')}</FieldLabel>
						<FieldRow justifyContent='flex-start' spacing={1}>
							{user.roles.map((role, index) => (
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
						<FieldRow>{formatDateAndTime(user.createdAt)}</FieldRow>
					</Field>
				</FieldGroup>
			</Box>
		);
	};

	const renderDeletedUserWarning = () => {
		return (
			<Box>
				<Callout mbs={8} type='warning' icon='warning'>
					{t('Moderation_User_deleted_warning')}
				</Callout>
			</Box>
		);
	};

	const renderUserReports = (reports: Serialized<Omit<UserReport, 'moderationInfo'>[]>) => {
		return reports.map((report, ind) => (
			<Box key={report._id}>
				<ReportReason ind={ind + 1} uinfo={report.reportedBy?.username} msg={report.description} ts={new Date(report.ts)} />
			</Box>
		));
	};

	if (isError) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' pb={20} color='default'>
				<StatesIcon name='warning' variation='danger' />
				<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				<StatesActions>
					<StatesAction onClick={() => reloadUsersReports()}>{t('Reload_page')}</StatesAction>
				</StatesActions>
			</Box>
		);
	}

	return (
		<>
			<ContextualbarScrollableContent>
				{isLoading && <ContextualbarSkeleton />}
				{isSuccess && report.reports.length > 0 && (
					<>
						{report.user ? renderUserDetails(report.user) : renderDeletedUserWarning()}
						{renderUserReports(report.reports)}
					</>
				)}
				{isSuccess && report.reports.length === 0 && <GenericNoResults title={t('No_user_reports')} icon='user' />}
			</ContextualbarScrollableContent>
			{isSuccess && report.reports.length > 0 && (
				<ContextualbarFooter>
					<UserContextFooter userId={userId} deleted={!report.user} />
				</ContextualbarFooter>
			)}
		</>
	);
};

export default UserReportInfo;
