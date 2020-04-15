import { Box, Button, ButtonGroup, Skeleton, Table } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../ui/client/views/app/components/hooks';
import {
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ProgressStep,
} from '../../lib/ImporterProgressStep';

function ImportOperationSummary({
	type,
	importerKey,
	_updatedAt,
	status,
	file,
	user,
	count: {
		users = 0,
		channels = 0,
		messages = 0,
		total = 0,
	} = {
		users: null,
		channels: null,
		messages: null,
		total: null,
	},
	valid,
}) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const fileName = useMemo(() => {
		if (!file) {
			return '';
		}

		const fileName = file;

		const userPattern = `_${ user }_`;
		const idx = fileName.indexOf(userPattern);
		if (idx >= 0) {
			return fileName.slice(idx + userPattern.length);
		}

		return fileName;
	}, [file, user]);

	const canContinue = useMemo(() => valid && [
		ProgressStep.USER_SELECTION,
		...ImportWaitingStates,
		...ImportFileReadyStates,
		...ImportPreparingStartedStates,
	].includes(status), [valid, status]);

	const canCheckProgress = useMemo(() => valid && ImportingStartedStates.includes(status), [valid, status]);

	const hasActions = canContinue || canCheckProgress;

	const importProgressRoute = useRoute('admin-import-progress');
	const prepareImportRoute = useRoute('admin-import-prepare');

	const handlePrepareImportClick = () => {
		prepareImportRoute.push();
	};

	const handleImportProgressClick = () => {
		importProgressRoute.push();
	};

	return <>
		<Table.Row>
			<Table.Cell>
				<Box textStyle='p1' textColor='default'>{type}</Box>
				<Box textStyle='p1' textColor='hint'>{importerKey}</Box>
			</Table.Cell>
			<Table.Cell>{formatDateAndTime(_updatedAt)}</Table.Cell>
			<Table.Cell>{status && t(status.replace('importer_', 'importer_status_'))}</Table.Cell>
			<Table.Cell>{fileName}</Table.Cell>
			<Table.Cell align='center'>{users}</Table.Cell>
			<Table.Cell align='center'>{channels}</Table.Cell>
			<Table.Cell align='center'>{messages}</Table.Cell>
			<Table.Cell align='center'>{total}</Table.Cell>
		</Table.Row>
		{hasActions && <Table.Row>
			<Table.Cell colSpan={8}>
				<ButtonGroup>
					{canContinue && <Button primary onClick={handlePrepareImportClick}>{t('Continue')}</Button>}
					{canCheckProgress && <Button primary onClick={handleImportProgressClick}>{t('Check_Progress')}</Button>}
				</ButtonGroup>
			</Table.Cell>
		</Table.Row>}
	</>;
}

function ImportOperationSummarySkeleton() {
	return <Table.Row>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
		<Table.Cell><Skeleton /></Table.Cell>
	</Table.Row>;
}

ImportOperationSummary.Skeleton = ImportOperationSummarySkeleton;

export default ImportOperationSummary;
