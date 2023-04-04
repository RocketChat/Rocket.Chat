import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useFormatRelativeTime } from '../../../../hooks/useFormatRelativeTime';

type RetentionPolicyWarningProps = {
	filesOnly: boolean;
	excludePinned: boolean;
	maxAge: number;
};

const RetentionPolicyWarning = ({ filesOnly, excludePinned, maxAge }: RetentionPolicyWarningProps): ReactElement => {
	const t = useTranslation();

	const formatRelativeTime = useFormatRelativeTime();
	const time = useMemo(() => formatRelativeTime(maxAge), [formatRelativeTime, maxAge]);

	if (filesOnly) {
		return (
			<div className='start__purge-warning error-background error-border error-color'>
				<Icon name='warning' size='x20' />{' '}
				{excludePinned
					? t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time })
					: t('RetentionPolicy_RoomWarning_FilesOnly', { time })}
			</div>
		);
	}

	return (
		<div className='start__purge-warning error-background error-border error-color'>
			<Icon name='warning' size='x20' />{' '}
			{excludePinned ? t('RetentionPolicy_RoomWarning_Unpinned', { time }) : t('RetentionPolicy_RoomWarning', { time })}
		</div>
	);
};

export default RetentionPolicyWarning;
