import { Box, Button, ButtonGroup, Table, Throbber } from '@rocket.chat/fuselage';
import React, { useState, useEffect, useMemo } from 'react';

import { Page } from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { ImportWaitingStates, ImportFileReadyStates, ImportPreparingStartedStates, ImportingStartedStates, ProgressStep } from '../../lib/ImporterProgressStep';
import { useRoute } from '../../../../client/contexts/RouterContext';
import ImportOperationSummary from './ImportOperationSummary';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import { useEndpoint } from '../../../../client/contexts/ServerContext';

function ImportHistoryRoute() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canRunImport = usePermission('run-import');

	const [loading, setLoading] = useState(true);
	const [currentOperation, setCurrentOperation] = useState(false);
	const [latestOperations, setLatestOperations] = useState([]);

	const hasAnySuccessfulSlackImport = useMemo(() =>
		latestOperations?.some(({ importerKey, status }) => importerKey === 'slack' && status === ProgressStep.DONE), [latestOperations]);

	const canShowCurrentOperation = currentOperation?.valid;

	const canContinueOperation = useMemo(() => {
		if (!currentOperation?.valid) {
			return false;
		}

		const possibleStatus = [ProgressStep.USER_SELECTION].concat(ImportWaitingStates).concat(ImportFileReadyStates).concat(ImportPreparingStartedStates);
		return possibleStatus.includes(currentOperation.status);
	}, [currentOperation]);

	const canCheckOperationProgress = useMemo(() => {
		if (!currentOperation?.valid) {
			return false;
		}

		return ImportingStartedStates.includes(currentOperation.status);
	}, [currentOperation]);

	const getCurrentImportOperation = useEndpoint('GET', 'getCurrentImportOperation');
	const getLatestImportOperations = useEndpoint('GET', 'getLatestImportOperations');
	const downloadPendingFiles = useEndpoint('POST', 'downloadPendingFiles');

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

	const newImportRoute = useRoute('admin-import-new');
	const importProgressRoute = useRoute('admin-import-progress');
	const prepareImportRoute = useRoute('admin-import-prepare');

	const handleNewImportClick = () => {
		newImportRoute.push();
	};

	const handleDownloadPendingFilesClick = async () => {
		try {
			setLoading(true);
			const { count } = await downloadPendingFiles();

			if (count) {
				dispatchToastMessage({ type: 'success', message: t('No_files_left_to_download') });
				setLoading(false);
				return;
			}

			dispatchToastMessage({ type: 'success', message: t('File_Downloads_Started') });
			importProgressRoute.push();
		} catch (error) {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
			setLoading(false);
		}
	};

	const handlePrepareImportClick = () => {
		prepareImportRoute.push();
	};

	const handleImportProgressClick = () => {
		importProgressRoute.push();
	};

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <Page className='page-settings'>
		<Page.Header title={t('Import')}>
			<ButtonGroup>
				<Button primary disabled={loading} onClick={handleNewImportClick}>{t('Import_New_File')}</Button>
				{hasAnySuccessfulSlackImport && <Button disabled={loading} onClick={handleDownloadPendingFilesClick}>{t('Download_Pending_Files')}</Button>}
			</ButtonGroup>
		</Page.Header>
		<Page.ContentShadowScroll>
			{loading
				? <Throbber justifyContent='center' />
				: <>

					{canShowCurrentOperation && <>
						<div className='fixed-title'>
							<h2>{t('Current_Import_Operation')}</h2>
						</div>

						<div className='section'>
							<ImportOperationSummary {...currentOperation} />

							{canContinueOperation
								? <button className='rc-button rc-button--primary action prepare-btn' onClick={handlePrepareImportClick}>{t('Continue')}</button>
								: canCheckOperationProgress
									&& <button className='rc-button rc-button--primary action progress-btn' onClick={handleImportProgressClick}>{t('Check_Progress')}</button>}
						</div>
					</>}

					{latestOperations?.length > 0 && <>
						<div className='fixed-title'>
							<h2>{t('Recent_Import_History')}</h2>
						</div>

						{latestOperations.map((_operation) => (currentOperation?._id !== _operation._id || !currentOperation?.valid)
							&& <div key={_operation._id} className='section'>
								<ImportOperationSummary {..._operation} />
							</div>)}
					</>}
				</>}
		</Page.ContentShadowScroll>
	</Page>;
}

export default ImportHistoryRoute;
