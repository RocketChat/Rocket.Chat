import { Box, Margins, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useEndpoint, useTranslation, useStream } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, useMemo } from 'react';
import s from 'underscore.string';

import { ProgressStep, ImportingStartedStates } from '../../../../app/importer/lib/ImporterProgressStep';
import Page from '../../../components/Page';
import { useErrorHandler } from './useErrorHandler';

const ImportProgressPage = function ImportProgressPage() {
	const streamer = useStream('importer');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const handleError = useErrorHandler();

	const [importerKey, setImporterKey] = useSafely(useState(null));
	const [step, setStep] = useSafely(useState('Loading...'));
	const [completed, setCompleted] = useSafely(useState(0));
	const [total, setTotal] = useSafely(useState(0));

	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const getImportProgress = useEndpoint('GET', '/v1/getImportProgress');

	const importHistoryRoute = useRoute('admin-import');
	const prepareImportRoute = useRoute('admin-import-prepare');

	useEffect(() => {
		const loadCurrentOperation = async () => {
			try {
				const { operation } = await getCurrentImportOperation();

				if (!operation.valid) {
					importHistoryRoute.push();
					return;
				}

				if (!ImportingStartedStates.includes(operation.status)) {
					prepareImportRoute.push();
					return;
				}

				setImporterKey(operation.importerKey);
				setCompleted(operation.count.completed);
				setTotal(operation.count.total);
			} catch (error) {
				handleError(error, t('Failed_To_Load_Import_Data'));
				importHistoryRoute.push();
			}
		};

		loadCurrentOperation();
	}, [getCurrentImportOperation, handleError, importHistoryRoute, prepareImportRoute, setCompleted, setImporterKey, setTotal, t]);

	const handleProgressUpdated = useMutableCallback(({ key, step, count: { completed = 0, total = 0 } = {} }) => {
		if (key.toLowerCase() !== importerKey) {
			return;
		}

		switch (step) {
			case ProgressStep.DONE:
				dispatchToastMessage({
					type: 'success',
					message: t(step[0].toUpperCase() + step.slice(1)),
				});
				importHistoryRoute.push();
				return;

			case ProgressStep.ERROR:
			case ProgressStep.CANCELLED:
				handleError(t(step[0].toUpperCase() + step.slice(1)));
				importHistoryRoute.push();
				return;

			default:
				setStep(step);
				setCompleted(completed);
				setTotal(total);
				break;
		}
	});

	useEffect(() => {
		if (!importerKey) {
			return;
		}

		const loadImportProgress = async () => {
			try {
				const progress = await getImportProgress();

				if (!progress) {
					dispatchToastMessage({ type: 'warning', message: t('Importer_not_in_progress') });
					prepareImportRoute.push();
					return;
				}

				handleProgressUpdated(progress);
			} catch (error) {
				handleError(error, t('Failed_To_Load_Import_Data'));
				importHistoryRoute.push();
			}
		};

		const progressSubscription = streamer('progress', handleProgressUpdated);

		loadImportProgress();

		return () => {
			progressSubscription();
		};
	}, [
		dispatchToastMessage,
		getImportProgress,
		handleError,
		handleProgressUpdated,
		importHistoryRoute,
		importerKey,
		prepareImportRoute,
		setCompleted,
		setStep,
		setTotal,
		streamer,
		t,
	]);

	const progressRate = useMemo(() => {
		if (total === 0) {
			return null;
		}

		return (completed / total) * 100;
	}, [completed, total]);

	return (
		<Page>
			<Page.Header title={t('Importing_Data')} />

			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
					<Margins block='x24'>
						<Box is='p' fontScale='p2'>
							{t(step[0].toUpperCase() + step.slice(1))}
						</Box>
						{progressRate ? (
							<Box display='flex' justifyContent='center'>
								<Box is='progress' value={completed} max={total} marginInlineEnd='x24' />
								<Box is='span' fontScale='p2'>
									{completed}/{total} ({s.numberFormat(progressRate, 0)}%)
								</Box>
							</Box>
						) : (
							<Throbber justifyContent='center' />
						)}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ImportProgressPage;
