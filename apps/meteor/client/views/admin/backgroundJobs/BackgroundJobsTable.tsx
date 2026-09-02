import type { CronJobStatus, OmnichannelJobSource } from '@rocket.chat/core-typings';
import { Box, Pagination, Select, Tag } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableLoadingTable,
	GenericTableRow,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BackgroundJobsTab } from './BackgroundJobsPage';
import { BackgroundJobsTableHeader } from './BackgroundJobsTableHeader';
import { STATUS_LABEL, statusVariant } from './helpers';
import { useTranslateInterval } from './hooks/useTranslateInterval';
import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useTimeAgo } from '../../../hooks/useTimeAgo';

export type BackgroundJobsTableProps = {
	tab: BackgroundJobsTab;
	omnichannelSource: OmnichannelJobSource;
};

const BackgroundJobsTable = ({ tab, omnichannelSource }: BackgroundJobsTableProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [text, setText] = useState('');
	const [status, setStatus] = useState<CronJobStatus | 'all'>('all');
	const formatDateAndTime = useFormatDateAndTime();
	const timeAgo = useTimeAgo();
	const translateInterval = useTranslateInterval();
	const isDesktopOrLarger = useMediaQuery('(min-width: 1024px)');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const statusOptions: SelectOption[] = useMemo(
		() => [
			['all', t('All')],
			['running', t(STATUS_LABEL.running)],
			['scheduled', t(STATUS_LABEL.scheduled)],
			['failed', t(STATUS_LABEL.failed)],
			['disabled', t(STATUS_LABEL.disabled)],
		],
		[t],
	);

	const query = useDebouncedValue(
		useMemo(
			() => ({
				searchTerm: text.trim(),
				count: itemsPerPage,
				offset: current,
				...(status === 'all' ? {} : { status }),
			}),
			[text, itemsPerPage, current, status],
		),
		500,
	);

	const handleClick = (jobName: string): void => {
		router.navigate({
			name: 'admin-background-jobs',
			params: {
				tab,
				context: 'info',
				id: jobName,
			},
		});
	};

	useEffect(() => {
		setCurrent(0);
	}, [tab, omnichannelSource, setCurrent, text, status]);

	const getCoreJobs = useEndpoint('GET', '/v1/cron.jobs');
	const getAppJobs = useEndpoint('GET', '/v1/cron.appjobs');
	const getOmnichannelJobs = useEndpoint('GET', '/v1/cron.omnichanneljobs');

	const { data, isLoading, isSuccess, isError } = useQuery({
		queryKey: ['cron-jobs', tab, omnichannelSource, query],
		queryFn: async () => {
			if (tab === 'apps') {
				return getAppJobs(query);
			}
			if (tab === 'omnichannel') {
				return getOmnichannelJobs({
					...query,
					source: omnichannelSource,
				});
			}
			return getCoreJobs(query);
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const jobs = data?.jobs || [];

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)}>
				<Box flexGrow={0}>
					<Select
						options={statusOptions}
						value={status}
						onChange={(value) => setStatus(value)}
						placeholder={t('Status')}
						aria-label={t('Status')}
						width='100%'
					/>
				</Box>
			</FilterByText>
			{isError && (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='warning' title={t('Something_went_wrong')} />
				</Box>
			)}
			{isSuccess && jobs.length === 0 && (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults title={t('No_background_jobs_found')} />
				</Box>
			)}
			{isLoading && (
				<GenericTable>
					<BackgroundJobsTableHeader isDesktopOrLarger={isDesktopOrLarger} />
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={isDesktopOrLarger ? 5 : 3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && jobs.length > 0 && (
				<>
					<GenericTable>
						<BackgroundJobsTableHeader isDesktopOrLarger={isDesktopOrLarger} />
						<GenericTableBody>
							{jobs.map((job) => (
								<GenericTableRow key={job._id} tabIndex={0} role='link' action onClick={() => handleClick(job.name)}>
									<GenericTableCell withTruncatedText fontScale='p2'>
										{job.name}
									</GenericTableCell>
									<GenericTableCell>
										<Box display='flex'>
											<Tag variant={statusVariant(job.status)}>{job.status ? t(STATUS_LABEL[job.status]) : t('Unknown')}</Tag>
										</Box>
									</GenericTableCell>
									{isDesktopOrLarger && (
										<>
											<GenericTableCell withTruncatedText>{job.lastRunAt ? timeAgo(job.lastRunAt) : ''}</GenericTableCell>
											<GenericTableCell withTruncatedText>
												{job.status !== 'disabled' && job.nextRunAt ? formatDateAndTime(job.nextRunAt) : ''}
											</GenericTableCell>
										</>
									)}
									<GenericTableCell withTruncatedText>{translateInterval(job.repeatInterval)}</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default BackgroundJobsTable;
