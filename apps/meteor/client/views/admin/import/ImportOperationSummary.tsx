import { TableRow, TableCell } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { MomentInput } from 'moment';
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

type statusType =
	| 'importer_new'
	| 'importer_uploading'
	| 'importer_downloading_file'
	| 'importer_file_loaded'
	| 'importer_preparing_started'
	| 'importer_preparing_users'
	| 'importer_preparing_channels'
	| 'importer_preparing_messages'
	| 'importer_user_selection';

type statusTypeCanCheckProgress =
	| 'importer_importing_started'
	| 'importer_importing_users'
	| 'importer_importing_channels'
	| 'importer_importing_messages'
	| 'importer_importing_files'
	| 'importer_finishing';

function ImportOperationSummary({
	type,
	_updatedAt,
	status,
	file = '',
	user,
	small,
	count: { users = 0, channels = 0, messages = 0, total = 0 } = {},
	valid,
}: {
	type: string;
	_updatedAt: MomentInput;
	status: statusType;
	file: string;
	user: string;
	small: boolean;
	count: { users: number; channels: number; messages: number; total: number } | Record<string, unknown>;
	valid: boolean;
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

	const canCheckProgress = useMemo(() => valid && ImportingStartedStates.includes(status as statusTypeCanCheckProgress), [valid, status]);

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
					<TableCell>{status && t(status.replace('importer_', 'importer_status_') as TranslationKey)}</TableCell>
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
