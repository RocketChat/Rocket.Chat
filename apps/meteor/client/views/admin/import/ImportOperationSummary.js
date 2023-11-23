import { TableRow, TableCell } from '@rocket.chat/fuselage';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import {
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ProgressStep,
} from '../../../../app/importer/lib/ImporterProgressStep';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';

function ImportOperationSummary({
	type,
	_updatedAt,
	status,
	file = '',
	user,
	small,
	count: { users = 0, channels = 0, messages = 0, total = 0 } = {},
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
			[ProgressStep.USER_SELECTION, ...ImportWaitingStates, ...ImportFileReadyStates, ...ImportPreparingStartedStates].includes(status),
		[valid, status],
	);

	const canCheckProgress = useMemo(() => valid && ImportingStartedStates.includes(status), [valid, status]);

	const router = useRouter();

	const handleClick = () => {
		if (canContinue) {
			router.navigate('/admin/import/prepare');
			return;
		}

		if (canCheckProgress) {
			router.navigate('/admin/import/progress');
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
		<TableRow {...props}>
			<TableCell>{type}</TableCell>
			<TableCell>{formatDateAndTime(_updatedAt)}</TableCell>
			{!small && (
				<>
					<TableCell>{status && t(status.replace('importer_', 'importer_status_'))}</TableCell>
					<TableCell>{fileName}</TableCell>
					<TableCell align='center'>{users}</TableCell>
					<TableCell align='center'>{channels}</TableCell>
					<TableCell align='center'>{messages}</TableCell>
					<TableCell align='center'>{total}</TableCell>
				</>
			)}
		</TableRow>
	);
}

export default Object.assign(ImportOperationSummary, {
	Skeleton: ImportOperationSummarySkeleton,
});
