import { Button, ButtonGroup, Table } from '@rocket.chat/fuselage';
import { useMediaQuery, useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect, useMemo } from 'react';

import { ProgressStep } from '../../../../app/importer/lib/ImporterProgressStep';
import Page from '../../../components/Page';
import ImportOperationSummary from './ImportOperationSummary';

function ImportHistoryPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isLoading, setLoading] = useSafely(useState(true));
	const [currentOperation, setCurrentOperation] = useSafely(useState());
	const [latestOperations, setLatestOperations] = useSafely(useState([]));

	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const getLatestImportOperations = useEndpoint('GET', '/v1/getLatestImportOperations');
	const downloadPendingFiles = useEndpoint('POST', '/v1/downloadPendingFiles');
	const downloadPendingAvatars = useEndpoint('POST', '/v1/downloadPendingAvatars');

	const newImportRoute = useRoute('admin-import-new');
	const importProgressRoute = useRoute('admin-import-progress');

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);

			try {
				const { operation } = await getCurrentImportOperation();
				setCurrentOperation(operation);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Operation') });
			}

			try {
				const operations = await getLatestImportOperations();
				setLatestOperations(operations);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_History') });
			}

			setLoading(false);
		};

		loadData();
	}, [dispatchToastMessage, getCurrentImportOperation, getLatestImportOperations, setCurrentOperation, setLatestOperations, setLoading, t]);

	const hasAnySuccessfulImport = useMemo(() => latestOperations?.some(({ status }) => status === ProgressStep.DONE), [latestOperations]);

	const handleNewImportClick = () => {
		newImportRoute.push();
	};

	const handleDownloadPendingFilesClick = async () => {
		try {
			setLoading(true);
			const { count } = await downloadPendingFiles();

			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				setLoading(false);
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			importProgressRoute.push();
		} catch (error) {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
			setLoading(false);
		}
	};

	const handleDownloadPendingAvatarsClick = async () => {
		try {
			setLoading(true);
			const { count } = await downloadPendingAvatars();

			if (!count) {
				dispatchToastMessage({ type: 'info', message: t('No_files_left_to_download') });
				setLoading(false);
				return;
			}

			dispatchToastMessage({ type: 'info', message: t('File_Downloads_Started') });
			importProgressRoute.push();
		} catch (error) {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
			setLoading(false);
		}
	};

	const small = useMediaQuery('(max-width: 768px)');

	return (
		<Page>
			<Page.Header title={t('Import')}>
				<ButtonGroup>
					<Button primary disabled={isLoading} onClick={handleNewImportClick}>
						{t('Import_New_File')}
					</Button>
					{hasAnySuccessfulImport && (
						<Button disabled={isLoading} onClick={handleDownloadPendingFilesClick}>
							{t('Download_Pending_Files')}
						</Button>
					)}
					{hasAnySuccessfulImport && (
						<Button disabled={isLoading} onClick={handleDownloadPendingAvatarsClick}>
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
						{isLoading ? (
							Array.from({ length: 20 }, (_, i) => <ImportOperationSummary.Skeleton small={small} key={i} />)
						) : (
							<>
								{currentOperation?.valid && <ImportOperationSummary {...currentOperation} small={small} />}
								{latestOperations
									?.filter(({ _id }) => currentOperation?._id !== _id || !currentOperation?.valid)
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
