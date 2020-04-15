import { Button, ButtonGroup, Table } from '@rocket.chat/fuselage';
import React, { useState, useEffect, useMemo } from 'react';

import { Page } from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useEndpoint } from '../../../../client/contexts/ServerContext';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import ImportOperationSummary from './ImportOperationSummary';

function ImportHistoryPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [loading, setLoading] = useState(true);
	const [currentOperation, setCurrentOperation] = useState();
	const [latestOperations, setLatestOperations] = useState([]);

	const getCurrentImportOperation = useEndpoint('GET', 'getCurrentImportOperation');
	const getLatestImportOperations = useEndpoint('GET', 'getLatestImportOperations');
	const downloadPendingFiles = useEndpoint('POST', 'downloadPendingFiles');

	const newImportRoute = useRoute('admin-import-new');
	const importProgressRoute = useRoute('admin-import-progress');

	useEffect(() => {
		let mounted = true;

		const safe = (fn) => (...args) => {
			if (!mounted) {
				return;
			}

			fn(...args);
		};

		const loadData = async () => {
			safe(setLoading)(true);

			try {
				const { operation } = await getCurrentImportOperation();
				safe(setCurrentOperation)(operation);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Operation') });
			}

			try {
				const operations = await getLatestImportOperations();
				safe(setLatestOperations)(operations);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_History') });
			}

			safe(setLoading)(false);
		};

		loadData();

		return () => {
			mounted = false;
		};
	}, []);

	const hasAnySuccessfulSlackImport = useMemo(() =>
		latestOperations?.some(({ importerKey, status }) => importerKey === 'slack' && status === ProgressStep.DONE), [latestOperations]);

	const handleNewImportClick = () => {
		newImportRoute.push();
	};

	const handleDownloadPendingFilesClick = async () => {
		try {
			setLoading(true);
			const { count } = await downloadPendingFiles();

			if (count) {
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

	return <Page>
		<Page.Header title={t('Import')}>
			<ButtonGroup>
				<Button primary disabled={loading} onClick={handleNewImportClick}>{t('Import_New_File')}</Button>
				{hasAnySuccessfulSlackImport
					&& <Button disabled={loading} onClick={handleDownloadPendingFilesClick}>{t('Download_Pending_Files')}</Button>}
			</ButtonGroup>
		</Page.Header>
		<Page.ContentShadowScroll>
			<Table fixed>
				<Table.Head>
					<Table.Row>
						<Table.Cell is='th' rowSpan={2} width='x140'>{t('Import_Type')}</Table.Cell>
						<Table.Cell is='th' rowSpan={2}>{t('Last_Updated')}</Table.Cell>
						<Table.Cell is='th' rowSpan={2}>{t('Last_Status')}</Table.Cell>
						<Table.Cell is='th' rowSpan={2}>{t('File')}</Table.Cell>
						<Table.Cell is='th' align='center' colSpan={4} width='x320'>{t('Counters')}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell is='th' align='center'>{t('Users')}</Table.Cell>
						<Table.Cell is='th' align='center'>{t('Channels')}</Table.Cell>
						<Table.Cell is='th' align='center'>{t('Messages')}</Table.Cell>
						<Table.Cell is='th' align='center'>{t('Total')}</Table.Cell>
					</Table.Row>
				</Table.Head>
				<Table.Body>
					{loading
						? Array.from({ length: 20 }, (_, i) => <ImportOperationSummary.Skeleton key={i} />)
						: <>
							{currentOperation?.valid && <ImportOperationSummary {...currentOperation} />}
							{latestOperations
								.filter(({ _id }) => currentOperation?._id !== _id || !currentOperation?.valid)
								.map((operation) => <ImportOperationSummary key={operation._id} {...operation} />)}
						</>}
				</Table.Body>
			</Table>
		</Page.ContentShadowScroll>
	</Page>;
}

export default ImportHistoryPage;
