import { Box, Margins, Throbber } from '@rocket.chat/fuselage';
import React, { useEffect, useState, useMemo } from 'react';
import s from 'underscore.string';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ProgressStep, ImportingStartedStates } from '../../lib/ImporterProgressStep';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { ImporterWebsocketReceiver } from '../ImporterWebsocketReceiver';
import { useSafely } from '../../../../client/hooks/useSafely';
import { useEndpoint } from '../../../../client/contexts/ServerContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { Page } from '../../../../client/components/basic/Page';

function ImportProgressPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [importerKey, setImporterKey] = useSafely(useState(null));
	const [step, setStep] = useSafely(useState('Loading...'));
	const [completed, setCompleted] = useSafely(useState(0));
	const [total, setTotal] = useSafely(useState(0));

	const getCurrentImportOperation = useEndpoint('GET', 'getCurrentImportOperation');
	const getImportProgress = useEndpoint('GET', 'getImportProgress');

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
				dispatchToastMessage({ type: 'error', message: error || t('Failed_To_Load_Import_Data') });
				importHistoryRoute.push();
			}
		};

		loadCurrentOperation();
	}, []);

	useEffect(() => {
		if (!importerKey) {
			return;
		}

		const handleProgressUpdated = ({ key, step, count: { completed = 0, total = 0 } = {} }) => {
			if (key.toLowerCase() !== importerKey) {
				return;
			}

			switch (step) {
				case ProgressStep.DONE:
					dispatchToastMessage({ type: 'success', message: t(step[0].toUpperCase() + step.slice(1)) });
					importHistoryRoute.push();
					return;

				case ProgressStep.ERROR:
				case ProgressStep.CANCELLED:
					dispatchToastMessage({ type: 'error', message: t(step[0].toUpperCase() + step.slice(1)) });
					importHistoryRoute.push();
					return;

				default:
					setStep(step);
					setCompleted(completed);
					setTotal(total);
					break;
			}
		};

		const loadImportProgress = async () => {
			try {
				const progress = await getImportProgress();

				if (!progress) {
					dispatchToastMessage({ type: 'warning', message: t('Importer_not_in_progress') });
					prepareImportRoute.push();
					return;
				}

				ImporterWebsocketReceiver.registerCallback(handleProgressUpdated);
				handleProgressUpdated(progress);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error || t('Failed_To_Load_Import_Data') });
				importHistoryRoute.push();
			}
		};

		loadImportProgress();

		return () => {
			ImporterWebsocketReceiver.unregisterCallback(handleProgressUpdated);
		};
	}, [importerKey]);

	const progressRate = useMemo(() => {
		if (total === 0) {
			return null;
		}

		return completed / total * 100;
	});

	return <Page>
		<Page.Header title={t('Importing_Data')} />

		<Page.ContentShadowScroll>
			<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
				<Margins block='x24'>
					<Box is='p' textStyle='p1' textColor='default'>{t(step[0].toUpperCase() + step.slice(1))}</Box>
					{progressRate
						? <Box display='flex' justifyContent='center' textStyle='p1' textColor='default'>
							<Box is='progress' value={completed} max={total} marginInlineEnd='x24' />
							<Box is='span'>{completed}/{total} ({s.numberFormat(progressRate, 0) }%)</Box>
						</Box>
						: <Throbber justifyContent='center' />}
				</Margins>
			</Box>
		</Page.ContentShadowScroll>
	</Page>;
}

export default ImportProgressPage;
