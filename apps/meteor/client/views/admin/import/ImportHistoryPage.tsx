import { Button, ButtonGroup, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import { ProgressStep } from '../../../../app/importer/lib/ImporterProgressStep';
import Page from '../../../components/Page';
import ImportOperationSummary from './ImportOperationSummary';

function ImportHistoryPage() {
	const queryClient = useQueryClient();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const downloadPendingFiles = useEndpoint('POST', '/v1/downloadPendingFiles');
	const downloadPendingAvatars = useEndpoint('POST', '/v1/downloadPendingAvatars');

	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const getLatestImportOperations = useEndpoint('GET', '/v1/getLatestImportOperations');

	const newImportRoute = useRoute('admin-import-new');
	const importProgressRoute = useRoute('admin-import-progress');

	const currentOperation = useQuery(
		['ImportHistoryPage', 'currentOperation'],
		async () => {
			const { operation = { valid: false } } = await getCurrentImportOperation();
			return operation;
		},
		{
			onError: () => dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Operation') }),
		},
	);

	const latestOperations = useQuery(
		['ImportHistoryPage', 'latestOperations'],
		async () => {
			const operations = await getLatestImportOperations();
			return operations;
		},
		{
			onError: () => dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_History') }),
		},
	);

	const isLoading = currentOperation.isLoading || latestOperations.isLoading;

	const hasAnySuccessfulImport = useMemo(() => {
		return latestOperations.isSuccess && latestOperations.data.some(({ status }) => status === ProgressStep.DONE);
	}, [latestOperations.isSuccess, latestOperations.data]);

	const handleNewImportClick = () => {
		newImportRoute.push();
	};

	const downloadPendingFilesResult = useMutation({
		mutationFn: async () => downloadPendingFiles(),
		onError: (error) => {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
		},
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries(['ImportHistoryPage', 'currentOperation']);
			queryClient.invalidateQueries(['ImportHistoryPage', 'latestOperations']);
			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			importProgressRoute.push();
		},
	});

	const downloadPendingAvatarsResult = useMutation({
		mutationFn: async () => downloadPendingAvatars(),
		onError: (error) => {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
		},
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries(['ImportHistoryPage', 'currentOperation']);
			queryClient.invalidateQueries(['ImportHistoryPage', 'latestOperations']);
			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			importProgressRoute.push();
		},
	});

	const small = useMediaQuery('(max-width: 768px)');

	return (
		<Page>
			<Page.Header title={t('Import')}>
				<ButtonGroup>
					<Button primary disabled={isLoading} onClick={handleNewImportClick}>
						{t('Import_New_File')}
					</Button>
					{hasAnySuccessfulImport && (
						<Button disabled={isLoading || downloadPendingFilesResult.isLoading} onClick={() => downloadPendingFilesResult.mutate()}>
							{t('Download_Pending_Files')}
						</Button>
					)}
					{hasAnySuccessfulImport && (
						<Button disabled={isLoading || downloadPendingAvatarsResult.isLoading} onClick={() => downloadPendingAvatarsResult.mutate()}>
							{t('Download_Pending_Avatars')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Table fixed data-qa-id='ImportTable'>
					<Table.Head>
						<Table.Row>
							<Table.Cell is='th' rowSpan={2} width='x140'>
								{t('Import_Type')}
							</Table.Cell>
							<Table.Cell is='th' rowSpan={2}>
								{t('Last_Updated')}
							</Table.Cell>
							{!small && (
								<>
									<Table.Cell is='th' rowSpan={2}>
										{t('Last_Status')}
									</Table.Cell>
									<Table.Cell is='th' rowSpan={2}>
										{t('File')}
									</Table.Cell>
									<Table.Cell is='th' align='center' colSpan={4} width='x320'>
										{t('Counters')}
									</Table.Cell>
								</>
							)}
						</Table.Row>
						{!small && (
							<Table.Row>
								<Table.Cell is='th' align='center'>
									{t('Users')}
								</Table.Cell>
								<Table.Cell is='th' align='center'>
									{t('Channels')}
								</Table.Cell>
								<Table.Cell is='th' align='center'>
									{t('Messages')}
								</Table.Cell>
								<Table.Cell is='th' align='center'>
									{t('Total')}
								</Table.Cell>
							</Table.Row>
						)}
					</Table.Head>
					<Table.Body>
						{isLoading && (
							<>
								{Array.from({ length: 20 }, (_, i) => (
									<ImportOperationSummary.Skeleton small={small} key={i} />
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
									?.map((operation) => (
										<ImportOperationSummary key={operation._id} {...operation} valid={false} small={small} />
									))}
							</>
						)}
					</Table.Body>
				</Table>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default ImportHistoryPage;
