import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useFormattedRelativeTime } from '../../../hooks/useFormattedRelativeTime';
import { getMaxAgeInMS } from '../hooks/useRetentionPolicy';

type RetentionPolicyWarningProps = {
	filesOnly: boolean;
	excludePinned: boolean;
	maxAge: number;
};

const RetentionPolicyWarning = ({ filesOnly, excludePinned, maxAge }: RetentionPolicyWarningProps): ReactElement => {
	const t = useTranslation();
	const time = useFormattedRelativeTime(getMaxAgeInMS(maxAge));

	if (filesOnly) {
		return (
			<div
				aria-label={t('Retention_policy_warning_banner')}
				role='alert'
				aria-live='polite'
				className='start__purge-warning error-background error-border error-color'
			>
				<Icon name='warning' size='x20' />{' '}
				{excludePinned
					? t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time })
					: t('RetentionPolicy_RoomWarning_FilesOnly', { time })}
			</div>
		);
	}

	return (
		<div
			aria-label={t('Retention_policy_warning_banner')}
			role='alert'
			aria-live='polite'
			className='start__purge-warning error-background error-border error-color'
		>
			<Icon name='warning' size='x20' />{' '}
			{excludePinned ? t('RetentionPolicy_RoomWarning_Unpinned', { time }) : t('RetentionPolicy_RoomWarning', { time })}
		</div>
	);
};

export default RetentionPolicyWarning;
