import { Button, ButtonGroup, Table, TableHead, TableCell, TableRow, TableBody } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import ImportOperationSummary from './ImportOperationSummary';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';
import { ProgressStep } from '../../../../app/importer/lib/ImporterProgressStep';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

// TODO: review inner logic
function ImportHistoryPage() {
	const queryClient = useQueryClient();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const downloadPendingFiles = useEndpoint('POST', '/v1/downloadPendingFiles');
	const downloadPendingAvatars = useEndpoint('POST', '/v1/downloadPendingAvatars');

	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const getLatestImportOperations = useEndpoint('GET', '/v1/getLatestImportOperations');

	const router = useRouter();

	const currentOperation = useQuery({
		queryKey: ['ImportHistoryPage', 'currentOperation'],
		queryFn: async () => {
			const { operation = { valid: false } } = await getCurrentImportOperation();
			return operation;
		},
		meta: {
			errorToastMessage: t('Failed_To_Load_Import_Operation'),
		},
	});

	const latestOperations = useQuery({
		queryKey: ['ImportHistoryPage', 'latestOperations'],
		queryFn: async () => {
			const operations = await getLatestImportOperations();
			return operations;
		},
		meta: {
			errorToastMessage: t('Failed_To_Load_Import_History'),
		},
	});

	const isLoading = currentOperation.isPending || latestOperations.isPending;

	const hasAnySuccessfulImport = useMemo(() => {
		return latestOperations.isSuccess && latestOperations.data.some(({ status }) => status === ProgressStep.DONE);
	}, [latestOperations.isSuccess, latestOperations.data]);

	const handleNewImportClick = () => {
		router.navigate('/admin/import/new');
	};

	const downloadPendingFilesResult = useMutation({
		mutationFn: async () => downloadPendingFiles(),
		onError: (error) => {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
		},
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries({
				queryKey: ['ImportHistoryPage', 'currentOperation'],
			});
			queryClient.invalidateQueries({
				queryKey: ['ImportHistoryPage', 'latestOperations'],
			});
			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			router.navigate('/admin/import/progress');
		},
	});

	const downloadPendingAvatarsResult = useMutation({
		mutationFn: async () => downloadPendingAvatars(),
		onError: (error) => {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
		},
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries({
				queryKey: ['ImportHistoryPage', 'currentOperation'],
			});
			queryClient.invalidateQueries({
				queryKey: ['ImportHistoryPage', 'latestOperations'],
			});
			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			router.navigate('/admin/import/progress');
		},
	});

	const small = useMediaQuery('(max-width: 768px)');

	return (
		<Page>
			<PageHeader title={t('Import')}>
				<ButtonGroup>
					<Button primary disabled={isLoading} onClick={handleNewImportClick}>
						{t('Import_New_File')}
					</Button>
					{hasAnySuccessfulImport && (
						<Button
							loading={downloadPendingFilesResult.isPending}
							disabled={downloadPendingAvatarsResult.isPending}
							onClick={() => downloadPendingFilesResult.mutate()}
						>
							{t('Download_Pending_Files')}
						</Button>
					)}
					{hasAnySuccessfulImport && (
						<Button
							loading={downloadPendingAvatarsResult.isPending}
							disabled={downloadPendingFilesResult.isPending}
							onClick={() => downloadPendingAvatarsResult.mutate()}
						>
							{t('Download_Pending_Avatars')}
						</Button>
					)}
				</ButtonGroup>
			</PageHeader>
			<PageScrollableContentWithShadow>
				<Table fixed data-qa-id='ImportTable'>
					<TableHead>
						<TableRow>
							<TableCell is='th' rowSpan={2} width='x140'>
								{t('Import_Type')}
							</TableCell>
							<TableCell is='th' rowSpan={2}>
								{t('Last_Updated')}
							</TableCell>
							{!small && (
								<>
									<TableCell is='th' rowSpan={2}>
										{t('Last_Status')}
									</TableCell>
									<TableCell is='th' rowSpan={2}>
										{t('File')}
									</TableCell>
									<TableCell is='th' align='center' colSpan={4} width='x320'>
										{t('Counters')}
									</TableCell>
								</>
							)}
						</TableRow>
						{!small && (
							<TableRow>
								<TableCell is='th' align='center'>
									{t('Users')}
								</TableCell>
								<TableCell is='th' align='center'>
									{t('Contacts')}
								</TableCell>
								<TableCell is='th' align='center'>
									{t('Channels')}
								</TableCell>
								<TableCell is='th' align='center'>
									{t('Messages')}
								</TableCell>
								<TableCell is='th' align='center'>
									{t('Total')}
								</TableCell>
							</TableRow>
						)}
					</TableHead>
					<TableBody>
						{isLoading && (
							<>
								{Array.from({ length: 20 }, (_, i) => (
									<ImportOperationSummarySkeleton key={i} small={small} />
								))}
							</>
						)}

						{currentOperation.isSuccess && currentOperation.data.valid && (
							<ImportOperationSummary {...currentOperation.data} small={small} />
						)}
						{currentOperation.isSuccess && latestOperations.isSuccess && (
							<>
								{latestOperations.data
									.filter(({ _id }) => !currentOperation.data.valid || currentOperation.data._id !== _id)
									// Forcing valid=false as the current API only accept preparation/progress over currentOperation
									?.map((operation) => <ImportOperationSummary key={operation._id} {...operation} valid={false} small={small} />)}
							</>
						)}
					</TableBody>
				</Table>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default ImportHistoryPage;
