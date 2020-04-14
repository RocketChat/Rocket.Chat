import { Throbber } from '@rocket.chat/fuselage';
import React, { useState, useEffect, useMemo } from 'react';

import { Page } from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { APIClient } from '../../../utils/client';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { ImportWaitingStates, ImportFileReadyStates, ImportPreparingStartedStates, ImportingStartedStates, ProgressStep } from '../../lib/ImporterProgressStep';
import { useRoute } from '../../../../client/contexts/RouterContext';
import ImportOperationSummary from './ImportOperationSummary';

function ImportHistoryRoute() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canRunImport = usePermission('run-import');

	const [preparing, setPreparing] = useState(true);
	const [history, setHistory] = useState([]);
	const [operation, setOperation] = useState(false);

	const anySuccessfulSlackImports = useMemo(() => {
		if (!history) {
			return false;
		}

		for (const _operation of history) {
			if (_operation.importerKey === 'slack' && _operation.status === ProgressStep.DONE) {
				return true;
			}
		}

		return false;
	}, [history]);

	const canShowCurrentOperation = operation?.valid;

	const canContinueOperation = useMemo(() => {
		if (!operation?.valid) {
			return false;
		}

		const possibleStatus = [ProgressStep.USER_SELECTION].concat(ImportWaitingStates).concat(ImportFileReadyStates).concat(ImportPreparingStartedStates);
		return possibleStatus.includes(operation.status);
	}, [operation]);

	const canCheckOperationProgress = useMemo(() => {
		if (!operation?.valid) {
			return false;
		}

		return ImportingStartedStates.includes(operation.status);
	}, [operation]);

	useEffect(() => {
		APIClient.get('v1/getCurrentImportOperation').then((data) => {
			setOperation(data.operation);

			APIClient.get('v1/getLatestImportOperations').then((data) => {
				setHistory(data);
				setPreparing(false);
			}).catch((error) => {
				if (error) {
					dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_History') });
					setPreparing(false);
				}
			});
		}).catch((error) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Operation') });
				setPreparing(false);
			}
		});
	}, []);

	const goToNewImport = useRoute('admin-import-new');
	const goToImportProgress = useRoute('admin-import-progress');
	const goToPrepareImport = useRoute('admin-import-prepare');

	const handleNewImportClick = () => {
		goToNewImport();
	};

	const handleDownloadPendingFilesClick = () => {
		setPreparing(true);

		APIClient.post('v1/downloadPendingFiles').then((data) => {
			setPreparing(false);
			if (data.count) {
				dispatchToastMessage({ type: 'success', message: t('File_Downloads_Started') });
				goToImportProgress();
			} else {
				dispatchToastMessage({ type: 'success', message: t('No_files_left_to_download') });
			}
		}).catch((error) => {
			setPreparing(false);
			console.error(error);
			dispatchToastMessage({ type: 'error', message: t('Failed_To_Download_Files') });
		});
	};

	const handlePrepareImportClick = () => {
		goToPrepareImport();
	};

	const handleImportProgressClick = () => {
		goToImportProgress();
	};

	return <Page className='page-settings'>
		<Page.Header title={t('Import')} />
		<Page.ContentShadowScroll>
			{!canRunImport
				? <p>{t('You_are_not_authorized_to_view_this_page')}</p>
				: <>
					{preparing
						? <Throbber justifyContent='center' />
						: <>
							<div className='rc-button__group'>
								<button className='rc-button rc-button--primary action new-import-btn' onClick={handleNewImportClick}>{t('Import_New_File')}</button>
								{anySuccessfulSlackImports && <input type='button' className='rc-button action download-slack-files-btn' value={t('Download_Pending_Files')} onClick={handleDownloadPendingFilesClick} />}
							</div>

							{canShowCurrentOperation && <>
								<div className='fixed-title'>
									<h2>{t('Current_Import_Operation')}</h2>
								</div>

								<div className='section'>
									<ImportOperationSummary {...operation} />

									{canContinueOperation
										? <button className='rc-button rc-button--primary action prepare-btn' onClick={handlePrepareImportClick}>{t('Continue')}</button>
										: canCheckOperationProgress
									&& <button className='rc-button rc-button--primary action progress-btn' onClick={handleImportProgressClick}>{t('Check_Progress')}</button>}
								</div>
							</>}

							{history?.length > 0 && <>
								<div className='fixed-title'>
									<h2>{t('Recent_Import_History')}</h2>
								</div>

								{history.map((_operation) => (operation?._id !== _operation._id || !operation?.valid)
									&& <div key={_operation._id} className='section'>
										<ImportOperationSummary {..._operation} />
									</div>)}
							</>}
						</>}
				</>}
		</Page.ContentShadowScroll>
	</Page>;
}

export default ImportHistoryRoute;
