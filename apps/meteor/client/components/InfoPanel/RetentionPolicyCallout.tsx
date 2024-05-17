import { Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { useFormattedRelativeTime } from '../../hooks/useFormattedRelativeTime';

type RetentionPolicyCalloutProps = {
	filesOnlyDefault: boolean;
	excludePinnedDefault: boolean;
	maxAgeDefault: number;
};

const RetentionPolicyCallout: FC<RetentionPolicyCalloutProps> = ({ filesOnlyDefault, excludePinnedDefault, maxAgeDefault }) => {
	const t = useTranslation();
	const retentionPolicyContentId = useUniqueId();
	const time = useFormattedRelativeTime(maxAgeDefault);

	return (
		<Callout role='alert' aria-labelledby={retentionPolicyContentId} aria-live='polite' type='warning'>
			<div id={retentionPolicyContentId}>
				{filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_FilesOnly', { time })}</p>}
				{filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_UnpinnedFilesOnly', { time })}</p>}
				{!filesOnlyDefault && excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning', { time })}</p>}
				{!filesOnlyDefault && !excludePinnedDefault && <p>{t('RetentionPolicy_RoomWarning_Unpinned', { time })}</p>}
			</div>
		</Callout>
	);
};

export default RetentionPolicyCallout;
