import { Throbber } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useEffect, useState, useMemo } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ProgressStep, ImportingStartedStates } from '../../lib/ImporterProgressStep';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { ImporterWebsocketReceiver } from '../ImporterWebsocketReceiver';
import { handleError, APIClient } from '../../../utils/client';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';

function ImportProgressRoute() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [step, setStep] = useState(t('Loading...'));
	const [completed, setComplete] = useState(0);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		let importerKey = false;

		const _updateProgress = (progress) => {
			switch (progress.step) {
				case ProgressStep.DONE:
					dispatchToastMessage({ type: 'success', message: t(progress.step[0].toUpperCase() + progress.step.slice(1)) });
					return FlowRouter.go('admin-import');
				case ProgressStep.ERROR:
				case ProgressStep.CANCELLED:
					dispatchToastMessage({ type: 'error', message: t(progress.step[0].toUpperCase() + progress.step.slice(1)) });
					return FlowRouter.go('admin-import');
				default:
					setStep(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
					if (progress.count.completed) {
						setComplete(progress.count.completed);
					}
					if (progress.count.total) {
						setTotal(progress.count.total);
					}
					break;
			}
		};

		const progressUpdated = (progress) => {
			if (progress.key.toLowerCase() !== importerKey) {
				return;
			}

			_updateProgress(progress);
		};

		APIClient.get('v1/getCurrentImportOperation').then((data) => {
			const { operation } = data;

			if (!operation.valid) {
				return FlowRouter.go('admin-import');
			}

			// If the import has not started, move to the prepare screen
			if (!ImportingStartedStates.includes(operation.status)) {
				return FlowRouter.go('admin-import-prepare');
			}

			importerKey = operation.importerKey;
			if (operation.count) {
				if (operation.count.total) {
					setTotal(operation.count.total);
				}
				if (operation.count.completed) {
					setComplete(operation.count.completed);
				}
			}

			APIClient.get('v1/getImportProgress').then((progress) => {
				if (!progress) {
					dispatchToastMessage({ type: 'warning', message: t('Importer_not_in_progress') });
					return FlowRouter.go('admin-import-prepare');
				}

				const whereTo = _updateProgress(progress);

				if (!whereTo) {
					ImporterWebsocketReceiver.registerCallback(progressUpdated);
				}
			}).catch((error) => {
				console.warn('Error on getting the import progress:', error);

				if (error) {
					handleError(error);
				} else {
					dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Data') });
				}

				return FlowRouter.go('admin-import');
			});
		}).catch((error) => {
			if (error) {
				handleError(error);
			} else {
				dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Data') });
			}
			return FlowRouter.go('admin-import');
		});

		return () => {
			ImporterWebsocketReceiver.unregisterCallback(progressUpdated);
		};
	}, []);

	const progressRate = useMemo(() => {
		try {
			const rate = Math.floor(completed * 10000 / total) / 100;

			if (isNaN(rate)) {
				return '';
			}

			return `${ rate }%`;
		} catch {
			return '';
		}
	});

	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <>
		<Throbber justifyContent='center' />
		<p>{step}</p>
		<p>{completed} / {total}</p>
		<p>{progressRate}</p>

		<p>{t('You_can_close_this_window_now')}</p>
	</>;
}

export default ImportProgressRoute;
