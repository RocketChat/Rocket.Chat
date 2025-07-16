import type { ProgressStep } from '@rocket.chat/core-typings';
import { Box, Margins, ProgressBar, Throbber } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useStream, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useErrorHandler } from './useErrorHandler';
import { ImportingStartedStates } from '../../../../app/importer/lib/ImporterProgressStep';
import { numberFormat } from '../../../../lib/utils/stringUtils';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

// TODO: review inner logic
const ImportProgressPage = function ImportProgressPage() {
	const queryClient = useQueryClient();
	const streamer = useStream('importers');
	const { t, i18n } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleError = useErrorHandler();

	const router = useRouter();

	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const getImportProgress = useEndpoint('GET', '/v1/getImportProgress');

	const mutation = useMutation({
		mutationFn: async (props: { step: ProgressStep; completed: number; total: number }) => {
			queryClient.setQueryData<{
				step: ProgressStep;
				completed: number;
				total: number;
			}>(['importers', 'progress'], props);
		},
	});

	const currentOperation = useQuery({
		queryKey: ['ImportProgressPage', 'currentOperation'],
		queryFn: async () => {
			const { operation } = await getCurrentImportOperation();
			return operation;
		},
		refetchInterval: 1000,
	});

	const handleProgressUpdated = useEffectEvent(
		({ key, step, completed, total }: { key: string; step: ProgressStep; completed: number; total: number }) => {
			if (!currentOperation.isSuccess) {
				return;
			}
			if (key.toLowerCase() !== currentOperation.data.importerKey.toLowerCase()) {
				return;
			}

			const message = step[0].toUpperCase() + step.slice(1);

			switch (step) {
				case 'importer_done':
					i18n.exists(message) &&
						dispatchToastMessage({
							type: 'success',
							message: t(message),
						});
					router.navigate('/admin/import');
					return;

				case 'importer_import_failed':
				case 'importer_import_cancelled':
					i18n.exists(message) && handleError(message);
					router.navigate('/admin/import');
					return;

				default:
					mutation.mutate({ step, completed, total });
					break;
			}
		},
	);

	const progress = useQuery({
		queryKey: ['importers', 'progress'],
		queryFn: async () => {
			const { key, step, count: { completed = 0, total = 0 } = {} } = await getImportProgress();
			return {
				key,
				step,
				completed,
				total,
			};
		},
		enabled: !!currentOperation.isSuccess,
	});

	useEffect(() => {
		if (progress.data) {
			const { step, key, total, completed } = progress.data;
			if (!progress) {
				dispatchToastMessage({ type: 'warning', message: t('Importer_not_in_progress') });
				router.navigate('/admin/import/prepare');
				return;
			}

			// do not use the endpoint data to update the completed progress, leave it to the streamer
			if (!(ImportingStartedStates as string[]).includes(step)) {
				handleProgressUpdated({
					key,
					step,
					total,
					completed,
				});
			}
		}
		if (progress.error) {
			handleError(progress.error, t('Failed_To_Load_Import_Data'));
			router.navigate('/admin/import');
		}
	}, [dispatchToastMessage, handleError, handleProgressUpdated, progress, router, t]);

	useEffect(() => {
		return streamer('progress', (progress) => {
			// There shouldn't be any progress update sending only the rate at this point of the process
			if (!('rate' in progress)) {
				handleProgressUpdated({
					key: progress.key,
					step: progress.step,
					completed: progress.count.completed,
					total: progress.count.total,
				});
			}
		});
	}, [handleProgressUpdated, streamer]);

	useEffect(() => {
		if (currentOperation?.data) {
			const { valid, status } = currentOperation.data;
			if (!valid) {
				router.navigate('/admin/import');
				return;
			}

			if (status === 'importer_done') {
				dispatchToastMessage({ type: 'success', message: t('Importer_done') });
				router.navigate('/admin/import');
				return;
			}

			if (!(ImportingStartedStates as string[]).includes(status)) {
				router.navigate('/admin/import/prepare');
			}
		}

		if (currentOperation?.error) {
			handleError(currentOperation.error, t('Failed_To_Load_Import_Data'));
			router.navigate('/admin/import');
		}
	}, [currentOperation, dispatchToastMessage, handleError, router, t]);

	return (
		<Page>
			<PageHeader title={t('Importing_Data')} />
			<PageScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
					<Margins block={24}>
						{currentOperation.isLoading && <Throbber justifyContent='center' />}
						{progress.fetchStatus !== 'idle' && progress.isLoading && <Throbber justifyContent='center' />}

						{(currentOperation.isError || progress.isError) && <Box is='p'>{t('Failed_To_Load_Import_Data')}</Box>}
						{progress.isSuccess && (
							<>
								<Box is='p' fontScale='p2'>
									{t((progress.data.step[0].toUpperCase() + progress.data.step.slice(1)) as any)}
								</Box>
								<Box display='flex' justifyContent='center'>
									<ProgressBar percentage={(progress.data.completed / progress.data.total) * 100} />
									<Box is='span' fontScale='p2' mis={24}>
										{numberFormat((progress.data.completed / progress.data.total) * 100, 0)}%
									</Box>
								</Box>
							</>
						)}
					</Margins>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default ImportProgressPage;
