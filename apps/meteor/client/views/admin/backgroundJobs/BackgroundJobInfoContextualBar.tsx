import { Box, Button, ButtonGroup, Callout, Tag } from '@rocket.chat/fuselage';
import { ContextualbarFooter, ContextualbarScrollableContent, GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundJobHistoryCard from './BackgroundJobHistoryCard';
import type { BackgroundJobsTab } from './BackgroundJobsPage';
import { STATUS_LABEL, statusVariant } from './helpers';
import { FormSkeleton } from '../../../components/Skeleton';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type BackgroundJobInfoContextualBarProps = {
	jobName: string;
	tab: BackgroundJobsTab;
	onClose: () => void;
};

const BackgroundJobInfoContextualBar = ({ jobName, tab, onClose }: BackgroundJobInfoContextualBarProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const getHistory = useEndpoint('GET', '/v1/cron.history');
	const getJob = useEndpoint('GET', '/v1/cron.job');
	const triggerJob = useEndpoint('POST', '/v1/cron.trigger');
	const enableJob = useEndpoint('POST', '/v1/cron.enable');
	const disableJob = useEndpoint('POST', '/v1/cron.disable');

	const { data: jobData, isLoading: isLoadingJob } = useQuery({
		queryKey: ['cron-job', jobName],
		queryFn: () => getJob({ jobName }),
		meta: { apiErrorToastMessage: true },
	});

	const {
		data,
		isLoading: isLoadingHistory,
		isError,
	} = useQuery({
		queryKey: ['cron-history', jobName],
		queryFn: () => getHistory({ jobName, count: 25, offset: 0 }),
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const triggerMutation = useMutation({
		mutationFn: () => triggerJob({ jobName }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Job_Triggered_Successfully') });
			void queryClient.invalidateQueries({ queryKey: ['cron-job', jobName] });
			void queryClient.invalidateQueries({ queryKey: ['cron-history', jobName] });
			void queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const enableMutation = useMutation({
		mutationFn: () => enableJob({ jobName }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Job_Enabled_Successfully') });
			void queryClient.invalidateQueries({ queryKey: ['cron-job', jobName] });
			void queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const disableMutation = useMutation({
		mutationFn: () => disableJob({ jobName }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Job_Disabled_Successfully') });
			void queryClient.invalidateQueries({ queryKey: ['cron-job', jobName] });
			void queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleRunNow = useCallback(() => {
		const closeModal = (): void => setModal();

		setModal(
			<GenericModal
				variant='danger'
				title={t('Run_now')}
				confirmText={t('Run_now')}
				onConfirm={async () => {
					try {
						await triggerMutation.mutateAsync();
					} finally {
						closeModal();
					}
				}}
				onCancel={closeModal}
			>
				{t('Background_Job_Run_now_confirm', { jobName })}
			</GenericModal>,
		);
	}, [jobName, setModal, t, triggerMutation]);

	if (isLoadingHistory || isLoadingJob) {
		return <FormSkeleton paddingInline={20} />;
	}

	if (isError) {
		return (
			<Box padding={20}>
				<Callout type='danger'>{t('Something_went_wrong')}</Callout>
			</Box>
		);
	}

	const history = data?.history || [];

	const currentJob = jobData?.job;
	const isDisabled = currentJob?.status === 'disabled';

	const isPending = triggerMutation.isPending || enableMutation.isPending || disableMutation.isPending;

	return (
		<>
			<ContextualbarScrollableContent>
				<Box fontScale='h3' marginBlockStart={16} marginBlockEnd={8} fontWeight={700}>
					{jobName}
				</Box>

				<Box marginBlockEnd={16} display='flex'>
					<Tag variant={statusVariant(currentJob?.status)}>{currentJob?.status ? t(STATUS_LABEL[currentJob.status]) : t('Unknown')}</Tag>
				</Box>

				<Box fontScale='h4' marginBlockStart={16} marginBlockEnd={8}>
					{t('History')}
				</Box>

				{history.length === 0 && (
					<Box color='hint' fontScale='p2'>
						{t('No_history_available')}
					</Box>
				)}

				{history.length > 0 && (
					<Box display='flex' flexDirection='column' paddingBlockStart={8} gap={16}>
						{history.map((entry) => (
							<BackgroundJobHistoryCard key={entry._id} entry={entry} formatDateAndTime={formatDateAndTime} />
						))}
					</Box>
				)}
			</ContextualbarScrollableContent>
			{tab === 'system' && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						<Button disabled={isPending || isDisabled} onClick={handleRunNow}>
							{t('Run_now')}
						</Button>
						{isDisabled ? (
							<Button primary disabled={isPending} onClick={() => enableMutation.mutate()}>
								{t('Enable')}
							</Button>
						) : (
							<Button danger disabled={isPending} onClick={() => disableMutation.mutate()}>
								{t('Disable')}
							</Button>
						)}
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</>
	);
};

export default BackgroundJobInfoContextualBar;
