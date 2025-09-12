import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../../../components/GenericTable';
import AccordionLoading from '../../../components/AccordionLoading';
import { useAppSchedulerJobs } from '../../../hooks/useAppSchedulerJobs';

type AppSchedulerJobsProps = {
	id: string;
};

const AppSchedulerJobs = ({ id }: AppSchedulerJobsProps): ReactElement => {
	const { t } = useTranslation();
	const { data, isSuccess, isError, isLoading } = useAppSchedulerJobs({ appId: id });

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'failed':
				return 'danger';
			case 'running':
				return 'warning';
			case 'scheduled':
				return 'success';
			default:
				return 'default';
		}
	};

	const formatDate = (date: Date | undefined) => {
		if (!date) return '-';
		return new Date(date).toLocaleString();
	};

	return (
		<Box h='full' w='full' marginInline='auto' color='default' pbs={24}>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && data.jobs && data.jobs.length > 0 && (
				<CustomScrollbars>
					<GenericTable w='full'>
						<GenericTableHeader>
							<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='status'>{t('Status')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='nextRunAt'>{t('Next_Run')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='lastRunAt'>{t('Last_Run')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='repeatInterval'>{t('Interval')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{data?.jobs?.map((job) => (
								<GenericTableRow key={job.id}>
									<GenericTableCell>{job.name}</GenericTableCell>
									<GenericTableCell>
										<Box justifyContent='flex-start' display='flex'>
											<Tag medium color={getStatusColor(job.status)}>
												{t(`Scheduler_Status_${job.status}`)}
											</Tag>
										</Box>
									</GenericTableCell>
									<GenericTableCell>{formatDate(job.nextRunAt)}</GenericTableCell>
									<GenericTableCell>{formatDate(job.lastRunAt)}</GenericTableCell>
									<GenericTableCell>{job.repeatInterval || '-'}</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
				</CustomScrollbars>
			)}
			{isSuccess && (!data.jobs || data.jobs.length === 0) && (
				<CustomScrollbars>
					<GenericNoResults />
				</CustomScrollbars>
			)}
		</Box>
	);
};

export default AppSchedulerJobs;
