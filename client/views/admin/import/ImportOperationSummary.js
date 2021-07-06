import { Table } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import {
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ProgressStep,
} from '../../../../app/importer/lib/ImporterProgressStep';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';

function ImportOperationSummary({
	type,
	_updatedAt,
	status,
	file,
	user,
	small,
	count: { users = 0, channels = 0, messages = 0, total = 0 } = {
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

		const userPattern = `_${user}_`;
		const idx = fileName.indexOf(userPattern);
		if (idx >= 0) {
			return fileName.slice(idx + userPattern.length);
		}

		return fileName;
	}, [file, user]);

	const canContinue = useMemo(
		() =>
			valid &&
			[
				ProgressStep.USER_SELECTION,
				...ImportWaitingStates,
				...ImportFileReadyStates,
				...ImportPreparingStartedStates,
			].includes(status),
		[valid, status],
	);

	const canCheckProgress = useMemo(
		() => valid && ImportingStartedStates.includes(status),
		[valid, status],
	);

	const prepareImportRoute = useRoute('admin-import-prepare');
	const importProgressRoute = useRoute('admin-import-progress');

	const handleClick = () => {
		if (canContinue) {
			prepareImportRoute.push();
			return;
		}

		if (canCheckProgress) {
			importProgressRoute.push();
		}
	};

	const hasAction = canContinue || canCheckProgress;

	const props = hasAction
		? {
				tabIndex: 0,
				role: 'link',
				action: true,
				onClick: handleClick,
		  }
		: {};

	return (
		<Table.Row {...props}>
			<Table.Cell>{type}</Table.Cell>
			<Table.Cell>{formatDateAndTime(_updatedAt)}</Table.Cell>
			{!small && (
				<>
					<Table.Cell>{status && t(status.replace('importer_', 'importer_status_'))}</Table.Cell>
					<Table.Cell>{fileName}</Table.Cell>
					<Table.Cell align='center'>{users}</Table.Cell>
					<Table.Cell align='center'>{channels}</Table.Cell>
					<Table.Cell align='center'>{messages}</Table.Cell>
					<Table.Cell align='center'>{total}</Table.Cell>
				</>
			)}
		</Table.Row>
	);
}

export default Object.assign(ImportOperationSummary, {
	Skeleton: ImportOperationSummarySkeleton,
});
