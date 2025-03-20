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
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UserContextFooter from './UserContextFooter';
import { ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import GenericNoResults from '../../../../components/GenericNoResults';
import { UserCardRole } from '../../../../components/UserCard';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import ReportReason from '../helpers/ReportReason';
import UserColumn from '../helpers/UserColumn';

const UserReportInfo = ({ userId }: { userId: string }) => {
	const { t } = useTranslation();
	const getUserReports = useEndpoint('GET', '/v1/moderation.user.reportsByUserId');
	const formatDateAndTime = useFormatDate();

	const {
		data: report,
		refetch: reloadUsersReports,
		isLoading,
		isSuccess,
		isError,
		dataUpdatedAt,
	} = useQuery({
		queryKey: ['moderation', 'userReports', 'fetchDetails', userId],
		queryFn: async () => getUserReports({ userId }),
	});

	const userProfile = useMemo(() => {
		if (!report?.user) {
			return null;
		}

		const { username, name } = report.user;
		return <UserColumn key={dataUpdatedAt} username={username} name={name} fontSize='p2' size='x48' />;
	}, [report?.user, dataUpdatedAt]);

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
						{report.user ? (
							<FieldGroup>
								<Field>{userProfile}</Field>
								<Field>
									<FieldLabel>{t('Roles')}</FieldLabel>
									<FieldRow justifyContent='flex-start' spacing={1}>
										{report.user.roles.map((role, index) => (
											<UserCardRole key={index}>{role}</UserCardRole>
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
						) : (
							<Callout mbs={8} type='warning' icon='warning'>
								{t('Moderation_User_deleted_warning')}
							</Callout>
						)}
						{report.reports.map((report, ind) => (
							<ReportReason key={ind} ind={ind + 1} uinfo={report.reportedBy?.username} msg={report.description} ts={new Date(report.ts)} />
						))}
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
