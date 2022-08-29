import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type RetentionPolicyWarningProps = {
	filesOnly: boolean;
	excludePinned: boolean;
	purgeTimeout: number;
};

const RetentionPolicyWarning = ({ filesOnly, excludePinned, purgeTimeout }: RetentionPolicyWarningProps): ReactElement | null => {
	const t = useTranslation();

	if (filesOnly) {
		return (
			<div className='start__purge-warning error-background error-border error-color'>
				<Icon name='warning' size='x20' />{' '}
				{excludePinned
					? t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time: purgeTimeout })
					: t('RetentionPolicy_RoomWarning_FilesOnly', { time: purgeTimeout })}
			</div>
		);
	}

	return (
		<div className='start__purge-warning error-background error-border error-color'>
			<Icon name='warning' size='x20' />{' '}
			{excludePinned
				? t('RetentionPolicy_RoomWarning_Unpinned', { time: purgeTimeout })
				: t('RetentionPolicy_RoomWarning', { time: purgeTimeout })}
		</div>
	);
};

export default RetentionPolicyWarning;
